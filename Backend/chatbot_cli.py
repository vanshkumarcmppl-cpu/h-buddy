# chatbot_cli.py

import os
import re
import sys # Import sys
import numpy as np
import faiss
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer, util
import groq
from tavily import TavilyClient

# --- 1. Configuration ---
PDF_FILES = [
    "CyberCrime Manual.pdf",
    "Indore Cybercrime Details and Actions_.pdf",
    "it_act_2000_updated.pdf",
]
MODEL_NAME = 'all-mpnet-base-v2'
LLM_NAME = 'llama3-8b-8192' 

# --- 2. Load and Chunk PDFs ---
def chunk_documents(documents, chunk_size=1000, chunk_overlap=200):
    all_chunks = []
    for doc in documents:
        text = doc['content']
        source = doc['source']
        text = re.sub(r'\s+', ' ', text).strip()
        if not text:
            continue
        start_index = 0
        while start_index < len(text):
            end_index = start_index + chunk_size
            chunk_content = text[start_index:end_index]
            all_chunks.append({"content": chunk_content, "source": source})
            start_index += chunk_size - chunk_overlap
    print(f"Created {len(all_chunks)} chunks.", file=sys.stderr)
    return all_chunks

def get_pdf_text_and_metadata(file_paths):
    documents = []
    for file_path in file_paths:
        try:
            filename = os.path.basename(file_path)
            reader = PdfReader(file_path)
            full_text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
            documents.append({"content": full_text, "source": filename})
            print(f"Loaded {filename}", file=sys.stderr)
        except Exception as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
    return documents

# --- 3. Embed and Index ---
def create_vector_index(chunks, model):
    chunk_texts = [chunk['content'] for chunk in chunks]
    print(f"Generating embeddings for {len(chunk_texts)} chunks...", file=sys.stderr)
    embeddings = model.encode(chunk_texts, show_progress_bar=False, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)
    d = embeddings.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(embeddings)
    print(f"FAISS index created successfully.", file=sys.stderr)
    return index

# --- 4. Search ---
def search_index(query, model, index, chunks, k=5):
    query_vector = model.encode([query])
    faiss.normalize_L2(query_vector)
    distances, indices = index.search(query_vector, k)
    results = []
    for i in range(len(indices[0])):
        chunk_index = indices[0][i]
        if chunk_index < len(chunks):
             result_chunk = chunks[chunk_index]
             results.append({
                 "score": distances[0][i],
                 "content": result_chunk['content'],
                 "source": result_chunk['source']
             })
    return results

def search_web_for_context(query, tavily_client):
    print("Searching online...", file=sys.stderr)
    try:
        response = tavily_client.search(query=query, search_depth="basic")
        if response.get("answer"):
            return response["answer"]
        context = "\n\n".join([result["content"] for result in response["results"]])
        return context
    except Exception as e:
        print(f"Web search error: {e}", file=sys.stderr)
        return None

# --- 5. Synthesize and Format the Answer ---
def generate_synthesized_answer(query, search_results, embedding_model, groq_client, tavily_client):
    query_emb = embedding_model.encode(query, convert_to_tensor=True)
    relevant_chunks = []
    sources = set()
    source_type = "local"

    for result in search_results:
        chunk_emb = embedding_model.encode(result['content'], convert_to_tensor=True)
        similarity = util.cos_sim(query_emb, chunk_emb).item()
        if similarity > 0.5:
            relevant_chunks.append(result['content'])
            sources.add(result['source'])

    if not relevant_chunks:
        context = search_web_for_context(query, tavily_client)
        source_type = "web"
        if not context:
            return "I could not find a relevant answer in your documents or online. Please try rephrasing your query."
    else:
        relevant_chunks = list(dict.fromkeys(relevant_chunks))
        context = "\n\n---\n\n".join(relevant_chunks)

    system_prompt = "You are an expert assistant specializing in Indian cybercrime law and procedures based on the provided documents. Your task is to synthesize information from the provided context to answer the user's query. Format your answers clearly. If steps are involved, use a numbered list. Begin your response directly."
    user_prompt = f'User\'s Query: "{query}"\n\nCONTEXT:\n{context}\n---\n\nSynthesized Answer:'
    
    print("Synthesizing the final answer with Groq...", file=sys.stderr)
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=LLM_NAME,
            temperature=0.2,
            max_tokens=1500
        )
        final_answer = chat_completion.choices[0].message.content
    except Exception as e:
        return f"An error occurred while contacting the AI service: {e}"

    if source_type == "local" and sources:
        final_answer += f"\n\n*Source(s): {', '.join(sorted(list(sources)))}*"
    elif source_type == "web":
        final_answer += f"\n\n*This answer was generated using information from an online search.*"
        
    return final_answer

# --- Main Execution Block ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python chatbot_cli.py \"<Your Query>\"", file=sys.stderr)
        sys.exit(1)
    
    user_query = sys.argv[1]

    try:
        groq_client = groq.Groq(api_key=os.environ.get("GROQ_API_KEY"))
        tavily_api_key = os.environ.get("TAVILY_API_KEY")
        if not tavily_api_key: raise ValueError("TAVILY_API_KEY not set.")
        tavily_client = TavilyClient(api_key=tavily_api_key)
    except Exception as e:
        print(f"Error initializing API clients: {e}", file=sys.stderr)
        sys.exit(1)

    print("Loading sentence transformer model...", file=sys.stderr)
    embedding_model = SentenceTransformer(MODEL_NAME)
    
    documents = get_pdf_text_and_metadata(PDF_FILES)
    if not documents: sys.exit(1)
    
    chunks = chunk_documents(documents)
    if not chunks: sys.exit(1)

    vector_index = create_vector_index(chunks, embedding_model)

    search_results = search_index(user_query, embedding_model, vector_index, chunks, k=5)
    final_answer = generate_synthesized_answer(user_query, search_results, embedding_model, groq_client, tavily_client)
    
    # Print the final answer to stdout for the Node.js process to capture
    print(final_answer)