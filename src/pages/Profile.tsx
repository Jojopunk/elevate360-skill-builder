
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { User, Settings, LogOut, Loader2, Plus, BookOpen, Trash2 } from 'lucide-react';
import db, { EducationDetail } from '@/data/database';

const Profile = () => {
  const { currentUser, logout, updateUserProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [educationDetails, setEducationDetails] = useState<EducationDetail[]>([]);
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  
  const [showAddEducation, setShowAddEducation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setEmail(currentUser.email || '');
      
      // Load education details
      const loadEducation = async () => {
        try {
          const education = await db.educationDetails
            .where('userId')
            .equals(currentUser.id!)
            .toArray();
          
          setEducationDetails(education);
        } catch (error) {
          console.error('Error loading education details:', error);
        }
      };
      
      loadEducation();
    } else if (!isLoading) {
      navigate('/login');
    }
  }, [currentUser, navigate, isLoading]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    
    try {
      const success = await updateUserProfile(currentUser.id!, {
        fullName,
        email
      });
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated."
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddEducation = async () => {
    if (!currentUser) return;
    
    try {
      // Validate inputs
      if (!newEducation.institution || !newEducation.degree || !newEducation.startDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
      
      // Add to database
      const educationId = await db.educationDetails.add({
        userId: currentUser.id!,
        institution: newEducation.institution,
        degree: newEducation.degree,
        fieldOfStudy: newEducation.fieldOfStudy,
        startDate: new Date(newEducation.startDate),
        endDate: newEducation.endDate ? new Date(newEducation.endDate) : undefined,
        description: newEducation.description
      });
      
      // Get the added education detail
      const addedEducation = await db.educationDetails.get(educationId);
      
      if (addedEducation) {
        // Update local state
        setEducationDetails([...educationDetails, addedEducation]);
        
        // Reset form
        setNewEducation({
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          description: ''
        });
        
        setShowAddEducation(false);
        
        toast({
          title: "Education Added",
          description: "Your education details have been added successfully."
        });
      }
    } catch (error) {
      console.error('Error adding education:', error);
      toast({
        title: "Error",
        description: "Failed to add education details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEducation = async (id: number) => {
    try {
      await db.educationDetails.delete(id);
      setEducationDetails(educationDetails.filter(edu => edu.id !== id));
      
      toast({
        title: "Education Removed",
        description: "The education detail was successfully removed."
      });
    } catch (error) {
      console.error('Error deleting education:', error);
      toast({
        title: "Error",
        description: "Failed to delete education detail. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-navy animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col p-4 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-navy">My Profile</h1>
          <p className="text-gray-600">Manage your account and education details</p>
        </header>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <Card className="card-shadow mb-6">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 text-navy mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={currentUser.username || ''}
                      readOnly
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>
                  
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="w-full bg-navy hover:bg-navy-dark"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 text-navy mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-500 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="education">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-navy">Education Details</h2>
                <Button
                  size="sm"
                  onClick={() => setShowAddEducation(!showAddEducation)}
                  className="bg-navy hover:bg-navy-dark"
                >
                  {showAddEducation ? 'Cancel' : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              
              {showAddEducation && (
                <Card className="card-shadow mb-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Add Education</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <form className="space-y-3">
                      <div>
                        <Label htmlFor="institution">Institution</Label>
                        <Input
                          id="institution"
                          value={newEducation.institution}
                          onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                          className="mt-1"
                          placeholder="University or Institution name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input
                          id="degree"
                          value={newEducation.degree}
                          onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                          className="mt-1"
                          placeholder="Bachelor's, Master's, etc."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="fieldOfStudy">Field of Study</Label>
                        <Input
                          id="fieldOfStudy"
                          value={newEducation.fieldOfStudy}
                          onChange={(e) => setNewEducation({...newEducation, fieldOfStudy: e.target.value})}
                          className="mt-1"
                          placeholder="Computer Science, Business, etc."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newEducation.startDate}
                            onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date (or Expected)</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newEducation.endDate}
                            onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleAddEducation}
                        className="w-full bg-navy hover:bg-navy-dark"
                      >
                        Save Education
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              {educationDetails.length > 0 ? (
                educationDetails.map((edu) => (
                  <Card key={edu.id} className="card-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{edu.institution}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => edu.id && handleDeleteEducation(edu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-600">
                        {edu.startDate && new Date(edu.startDate).getFullYear()}
                        {edu.endDate ? ` - ${new Date(edu.endDate).getFullYear()}` : ' - Present'}
                      </p>
                      {edu.description && (
                        <p className="text-sm mt-2">{edu.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700">No Education Details</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Add your education history to complete your profile
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default Profile;
