import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface StudentCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentForm: {
    name: string;
    rollNumber: string;
    className: string;
    section: string;
    contact: string;
    address: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function StudentCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: StudentCreateDialogProps) {
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    className: '',
    section: '',
    contact: '',
    address: '',
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(studentForm);
    setStudentForm({ name: '', rollNumber: '', className: '', section: '', contact: '', address: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student identity and academic program info.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <Label required>Student Full Name</Label>
            <Input
              type="text"
              required
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              placeholder="Aarav Sharma"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Roll Number</Label>
              <Input
                type="text"
                value={studentForm.rollNumber}
                onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                placeholder="2026-CS-042"
              />
            </div>
            <div>
              <Label>Class / Program</Label>
              <Input
                type="text"
                value={studentForm.className}
                onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                placeholder="B.Sc CS"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Section</Label>
              <Input
                type="text"
                value={studentForm.section}
                onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                placeholder="A"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                type="text"
                value={studentForm.contact}
                onChange={(e) => setStudentForm({ ...studentForm, contact: e.target.value })}
                placeholder="+977 9801122334"
              />
            </div>
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
              Create Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
