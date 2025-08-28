import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Crown, 
  Calendar,
  FileText,
  Phone,
  Building,
  Shield
} from "lucide-react";

export const AdminUsersTab = () => {
  const { allUsers, makeUserAdmin, deleteUserProfile, loading, refreshData } = useAdmin();
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMakeAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    setPromoting(true);
    try {
      const { error } = await makeUserAdmin(newAdminEmail.trim());
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${newAdminEmail} has been promoted to admin`
      });
      
      setNewAdminEmail("");
      refreshData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to promote user",
        variant: "destructive"
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeleting(userId);
    try {
      const { error } = await deleteUserProfile(userId);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${userName} has been deleted`
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Admin Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Promote User to Admin
          </CardTitle>
          <CardDescription>
            Grant administrative privileges to existing users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter user email to promote"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              type="email"
            />
            <Button 
              onClick={handleMakeAdmin}
              disabled={promoting || !newAdminEmail.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {promoting ? "Promoting..." : "Make Admin"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            Manage registered users and their profiles ({allUsers.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                No users have registered yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">
                          {user.profile?.full_name || 'Unknown User'}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          ID: {user.id.slice(0, 8)}...
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              User Profile Details
                            </DialogTitle>
                            <DialogDescription>
                              Complete user information and activity
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                              <h3 className="font-semibold mb-3">Basic Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Full Name:</strong>
                                  <p className="text-muted-foreground">
                                    {user.profile?.full_name || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <strong>Email:</strong>
                                  <p className="text-muted-foreground">{user.email}</p>
                                </div>
                                <div>
                                  <strong>Phone:</strong>
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.profile?.phone_number || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <strong>Organization:</strong>
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {user.profile?.organization || 'Not provided'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Activity Stats */}
                            <div>
                              <h3 className="font-semibold mb-3">Activity Statistics</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 border rounded">
                                  <div className="text-2xl font-bold text-primary">{user.reports_count}</div>
                                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Reports Submitted
                                  </div>
                                </div>
                                <div className="text-center p-3 border rounded">
                                  <div className="text-2xl font-bold text-primary">
                                    {formatDate(user.created_at)}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Member Since
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Admin Actions */}
                            <div className="border-t pt-4">
                              <h3 className="font-semibold mb-3 text-red-600">Dangerous Actions</h3>
                              <div className="space-y-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User Profile
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User Profile</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action will permanently delete {user.profile?.full_name || user.email}'s profile.
                                        This action cannot be undone. Their reports will remain but won't be linked to a profile.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id, user.profile?.full_name || user.email)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deleting === user.id ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {user.profile?.full_name || user.email}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.profile?.full_name || user.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting === user.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground border-t pt-3">
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p>{user.profile?.phone_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Organization:</span>
                      <p>{user.profile?.organization || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Reports:</span>
                      <p>{user.reports_count} submitted</p>
                    </div>
                    <div>
                      <span className="font-medium">Joined:</span>
                      <p>{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};