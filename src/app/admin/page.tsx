
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldOff, UserX, UserCheck, Edit, ExternalLink, RefreshCw } from 'lucide-react';
import { getAllUsers, updateUserStatus, applyCustomBan } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BackgroundImage } from '@/components/auth/background-image';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface User {
    username: string;
    email: string;
    status: number;
    lastLoginAt?: string;
    bannedAt?: string;
    banReason?: string;
    unbanAt?: number;
}

const CountdownTimer = ({ unbanAt }: { unbanAt: number }) => {
    const [timeLeft, setTimeLeft] = useState(unbanAt - Date.now());

    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1000);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    if (timeLeft <= 0) {
        return <span className="text-green-400">Ban Expired</span>;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return <span>{`${hours}h ${minutes}m ${seconds}s`}</span>;
};

const statusMap: { [key: number]: { text: string; color: string } } = {
    1: { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    2: { text: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    3: { text: 'Banned (Perm)', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    4: { text: 'Banned (24h)', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    5: { text: 'Banned (Temp)', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    6: { text: 'Deleted', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    9: { text: 'Deactivated', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};


export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isCustomBanModalOpen, setIsCustomBanModalOpen] = useState(false);
    const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ action: () => void; title: string; description: string } | null>(null);
    const [customBanHours, setCustomBanHours] = useState(1);
    const [customBanReason, setCustomBanReason] = useState('');
    const [newStatus, setNewStatus] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const userList = await getAllUsers();
            setUsers(userList);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (username: string, status: number) => {
        const result = await updateUserStatus(username, status);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchUsers();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };
    
    const openConfirmation = (user: User, status: number, title: string, description: string) => {
        setConfirmAction({
            action: () => handleUpdateStatus(user.username, status),
            title,
            description,
        });
        setIsConfirmOpen(true);
    }
    
    const handleCustomBan = async () => {
        if(!selectedUser) return;
        const result = await applyCustomBan(selectedUser.username, customBanHours, customBanReason);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchUsers();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsCustomBanModalOpen(false);
        setSelectedUser(null);
        setCustomBanHours(1);
        setCustomBanReason('');
    }
    
    const handleChangeStatus = async () => {
        if(!selectedUser) return;
        await handleUpdateStatus(selectedUser.username, newStatus);
        setIsChangeStatusModalOpen(false);
        setSelectedUser(null);
        setNewStatus(0);
    }
    
    const isValidDate = (date: any) => date && !isNaN(new Date(date).getTime());
    
    const getUnbanTimestamp = (user: User): number | null => {
        if (user.status === 4 && user.bannedAt) { // 24-hour ban
            return new Date(user.bannedAt).getTime() + (24 * 60 * 60 * 1000);
        }
        if (user.status === 5 && user.unbanAt) { // Custom/temp ban
            return user.unbanAt;
        }
        return null;
    }

    const handleSiteButtonClick = () => {
        window.open('https://ura-manngerpro.netlify.app/', '_blank');
    };


    return (
        <>
        <main className="relative min-h-screen p-4 sm:p-6 md:p-8">
            <BackgroundImage />
            <div className="relative z-10">
                <Card className="bg-black/70 text-white border-white/20 backdrop-blur-lg shadow-2xl shadow-black/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-3xl text-primary font-bold">Admin Control Panel</CardTitle>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={handleSiteButtonClick} className="bg-transparent hover:bg-white/10 text-white">
                               <ExternalLink className="mr-2 h-4 w-4" /> Site
                            </Button>
                            <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading} className="bg-transparent hover:bg-white/10">
                               {isLoading ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-white/20">
                                            <TableHead>Username</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead>Ban Info</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => {
                                            const unbanTimestamp = getUnbanTimestamp(user);
                                            return (
                                                <TableRow key={user.username} className="border-white/10">
                                                    <TableCell className="font-medium">
                                                        {user.username}
                                                        <p className="text-xs text-white/60">{user.email}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusMap[user.status]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                                                            {statusMap[user.status]?.text || `Unknown (${user.status})`}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{isValidDate(user.lastLoginAt) ? formatDistanceToNow(new Date(user.lastLoginAt!), { addSuffix: true }) : 'Never'}</TableCell>
                                                    <TableCell>
                                                        {unbanTimestamp ? (
                                                            <div className="text-xs">
                                                                <p>{user.banReason}</p>
                                                                <CountdownTimer unbanAt={unbanTimestamp} />
                                                            </div>
                                                        ) : (user.status === 3 ? 'Permanent' : 'N/A')}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openConfirmation(user, 3, 'Permanent Ban', `Are you sure you want to permanently ban ${user.username}?`)} title="Permanent Ban"><Shield className="text-red-500"/></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setCustomBanHours(1); setCustomBanReason(''); setIsCustomBanModalOpen(true); }} title="Custom Ban"><ShieldOff className="text-yellow-500"/></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openConfirmation(user, 9, 'Deactivate User', `Are you sure you want to deactivate ${user.username}? This is for inactivity.`)} title="Deactivate"><UserX className="text-orange-500"/></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openConfirmation(user, 2, 'Activate/Unban User', `Are you sure you want to activate or unban ${user.username}?`)} title="Activate/Unban"><UserCheck className="text-green-500"/></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setNewStatus(user.status); setIsChangeStatusModalOpen(true); }} title="Edit Status"><Edit className="text-blue-400"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                             </div>
                        )}
                    </CardContent>
                </Card>
                 <Button variant="link" onClick={() => router.push('/')} className="text-white/80 hover:text-white mt-4 mx-auto block">
                    <ExternalLink className="mr-2"/> Go to Login Page
                </Button>
            </div>
        </main>
        
        {/* Confirmation Dialog */}
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent className="bg-black/80 text-white border-primary/30">
                <AlertDialogHeader>
                    <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/80">
                        {confirmAction?.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (confirmAction) confirmAction.action();
                        setIsConfirmOpen(false);
                    }}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Custom Ban Modal */}
        <Dialog open={isCustomBanModalOpen} onOpenChange={setIsCustomBanModalOpen}>
            <DialogContent className="bg-black/80 text-white border-primary/30">
                <DialogHeader>
                    <DialogTitle>Custom Ban for {selectedUser?.username}</DialogTitle>
                    <DialogDescription>Set a temporary ban duration in hours and provide a reason.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">Duration (Hours)</Label>
                        <Input id="duration" type="number" value={customBanHours} onChange={(e) => setCustomBanHours(parseInt(e.target.value) || 0)} className="col-span-3 bg-black/30 border-white/20"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason" className="text-right">Reason</Label>
                        <Input id="reason" value={customBanReason} onChange={(e) => setCustomBanReason(e.target.value)} className="col-span-3 bg-black/30 border-white/20"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCustomBanModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCustomBan}>Apply Ban</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Change Status Modal */}
        <Dialog open={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen}>
            <DialogContent className="bg-black/80 text-white border-primary/30">
                <DialogHeader>
                    <DialogTitle>Change Status for {selectedUser?.username}</DialogTitle>
                    <DialogDescription>Manually set the user's status code.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">New Status</Label>
                        <Input id="status" type="number" value={newStatus} onChange={(e) => setNewStatus(parseInt(e.target.value) || 0)} className="col-span-3 bg-black/30 border-white/20"/>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChangeStatusModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleChangeStatus}>Update Status</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
