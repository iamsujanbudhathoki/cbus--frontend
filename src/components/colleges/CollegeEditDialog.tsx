import React from 'react';
import { Status } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CollegeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editCollegeForm: {
    name: string;
    code: string;
    address: string;
    contactPhone: string;
    contactEmail: string;
    status: Status;
  };
  setEditCollegeForm: React.Dispatch<React.SetStateAction<{
    name: string;
    code: string;
    address: string;
    contactPhone: string;
    contactEmail: string;
    status: Status;
  }>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export function CollegeEditDialog({
  isOpen,
  onClose,
  editCollegeForm,
  setEditCollegeForm,
  onSubmit,
  isSubmitting,
}: CollegeEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit College Profile</DialogTitle>
          <DialogDescription>
            Update institution contact information and status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label required>College Name</Label>
            <Input
              type="text"
              required
              value={editCollegeForm.name}
              onChange={(e) => setEditCollegeForm({ ...editCollegeForm, name: e.target.value })}
            />
          </div>

          <div>
            <Label required>College Code</Label>
            <Input
              type="text"
              required
              value={editCollegeForm.code}
              onChange={(e) => setEditCollegeForm({ ...editCollegeForm, code: e.target.value })}
            />
          </div>

          <div>
            <Label>Campus Address</Label>
            <Input
              type="text"
              value={editCollegeForm.address}
              onChange={(e) => setEditCollegeForm({ ...editCollegeForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Contact Phone</Label>
              <Input
                type="text"
                value={editCollegeForm.contactPhone}
                onChange={(e) => setEditCollegeForm({ ...editCollegeForm, contactPhone: e.target.value })}
              />
            </div>

            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={editCollegeForm.contactEmail}
                onChange={(e) => setEditCollegeForm({ ...editCollegeForm, contactEmail: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Institution Status</Label>
            <Select
              value={editCollegeForm.status}
              onValueChange={(val: Status) => setEditCollegeForm({ ...editCollegeForm, status: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Status.ACTIVE}>ACTIVE</SelectItem>
                <SelectItem value={Status.INACTIVE}>INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
