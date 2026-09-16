import React from 'react';
import { Parent, Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
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
import { AlertCircle, Loader2, UserCheck, X } from 'lucide-react';

interface ParentLinkChildDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParentForLink: Parent | null;
  selectedStudentIds: string[];
  setSelectedStudentIds: (ids: string[]) => void;
  relationship: string;
  setRelationship: (rel: string) => void;
  students: Student[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  isLoadingStudents?: boolean;
  errorMsg?: string | null;
}

export function ParentLinkChildDialog({
  isOpen,
  onClose,
  selectedParentForLink,
  selectedStudentIds,
  setSelectedStudentIds,
  relationship,
  setRelationship,
  students,
  onSubmit,
  isSubmitting,
  isLoadingStudents = false,
  errorMsg = null,
}: ParentLinkChildDialogProps) {
  const studentOptions: MultiSelectOption[] = React.useMemo(() => {
    return students.map((st) => {
      const existingParent = st.parents && st.parents.length > 0 ? st.parents[0] : null;
      let badgeText = st.rollNumber ? `Roll: ${st.rollNumber}` : undefined;

      if (existingParent) {
        if (selectedParentForLink && existingParent.id === selectedParentForLink.id) {
          badgeText = 'Currently Linked';
        } else {
          badgeText = `Linked: ${existingParent.name}`;
        }
      }

      return {
        value: st.id,
        label: st.name,
        description: `Class: ${st.className || 'N/A'} • ${
          st.assignedBus?.busNumber ? `Bus: ${st.assignedBus.busNumber}` : 'No Bus'
        }`,
        badge: badgeText,
      };
    });
  }, [students, selectedParentForLink]);

  const selectedStudents = React.useMemo(() => {
    return selectedStudentIds
      .map((id) => students.find((s) => s.id === id))
      .filter((s): s is Student => Boolean(s));
  }, [selectedStudentIds, students]);

  const handleRemoveStudent = (idToRemove: string) => {
    setSelectedStudentIds(selectedStudentIds.filter((id) => id !== idToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">
            Link Child to {selectedParentForLink?.name || 'Parent'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select one or more student records to associate with this parent account.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="leading-snug">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label required className="mb-1.5 block text-xs">
              Select Students
            </Label>

            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-6 border border-dashed rounded-lg bg-slate-50 text-xs text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Loading student records...
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
                No student records found for this college.
              </div>
            ) : (
              <MultiSelect
                options={studentOptions}
                selected={selectedStudentIds}
                onChange={setSelectedStudentIds}
                placeholder="Search and select students..."
                searchPlaceholder="Search by name, roll, class..."
                emptyText="No matching student found."
                disabled={isSubmitting}
                maxDisplay={3}
              />
            )}
          </div>

          {/* Selected Students Chip List */}
          {selectedStudents.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                <span>Selected Children ({selectedStudents.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                  disabled={isSubmitting}
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-0.5">
                {selectedStudents.map((st) => (
                  <div
                    key={st.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-200 shadow-xs px-2 py-1 text-xs text-slate-700"
                  >
                    <UserCheck className="h-3 w-3 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800">{st.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({st.className || 'N/A'})
                    </span>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(st.id)}
                        className="rounded p-0.5 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors focus:outline-none shrink-0"
                        aria-label={`Remove ${st.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label required className="mb-1.5 block text-xs">
              Relationship
            </Label>
            <Select value={relationship} onValueChange={setRelationship} disabled={isSubmitting}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select relationship..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={isSubmitting || !relationship || selectedStudentIds.length === 0}>
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {selectedStudentIds.length > 1 ? `Link ${selectedStudentIds.length} Children` : 'Link Child'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
