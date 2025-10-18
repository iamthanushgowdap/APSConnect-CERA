"use client";

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { FeeRecord, UserProfile, FeeStatus } from '@/types';
import { feeStatuses, semesters } from '@/types';
import { getUserProfiles, createFeeRecord, updateFeeRecord } from '@/lib/supabase-utils';
import { useAuth } from '@/components/auth-provider';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const feeRecordFormSchema = z.object({
  student_id: z.string({ required_error: "Please select a student." }),
  semester: z.string().min(1, "Semester is required."),
  year: z.coerce.number().min(2020, "Year must be 2020 or later.").max(2030, "Year too far in future."),
  tuition_fee: z.coerce.number().min(0, "Cannot be negative.").default(0),
  hostel_fee: z.coerce.number().min(0, "Cannot be negative.").default(0),
  library_fee: z.coerce.number().min(0, "Cannot be negative.").default(0),
  lab_fee: z.coerce.number().min(0, "Cannot be negative.").default(0),
  other_fees: z.coerce.number().min(0, "Cannot be negative.").default(0),
  total_amount: z.coerce.number().min(0, "Cannot be negative."),
  paid_amount: z.coerce.number().min(0, "Cannot be negative.").default(0),
  due_date: z.date({ required_error: "Due date is required." }),
  payment_method: z.string().optional(),
  transaction_id: z.string().optional(),
}).refine(data => data.total_amount >= data.paid_amount, {
  message: "Paid amount cannot exceed total amount",
  path: ["paid_amount"],
});

export type FeeRecordFormValues = z.infer<typeof feeRecordFormSchema>;

interface FeeRecordFormProps {
  onSubmitSuccess: (newRecord: FeeRecord) => void;
  initialData?: FeeRecord;
  students: UserProfile[];
}

export function FeeRecordForm({ onSubmitSuccess, initialData, students: initialStudents }: FeeRecordFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [students, setStudents] = React.useState<UserProfile[]>(initialStudents || []);

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentProfiles = await getUserProfiles({ role: 'student' });
        const approvedStudents = studentProfiles.filter(s => s.is_approved);
        setStudents(approvedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({ title: "Error", description: "Failed to load students.", variant: "destructive" });
      }
    };

    if (!initialStudents) {
      fetchStudents();
    }
  }, [initialStudents, toast]);

  const form = useForm<FeeRecordFormValues>({
    resolver: zodResolver(feeRecordFormSchema),
    defaultValues: {
      student_id: initialData?.student_id || undefined,
      semester: initialData?.semester || "",
      year: initialData?.year || new Date().getFullYear(),
      tuition_fee: initialData?.tuition_fee || 0,
      hostel_fee: initialData?.hostel_fee || 0,
      library_fee: initialData?.library_fee || 0,
      lab_fee: initialData?.lab_fee || 0,
      other_fees: initialData?.other_fees || 0,
      total_amount: initialData?.total_amount || 0,
      paid_amount: initialData?.paid_amount || 0,
      due_date: initialData?.due_date ? new Date(initialData.due_date) : new Date(),
      payment_method: initialData?.payment_method || "",
      transaction_id: initialData?.transaction_id || "",
    },
  });

  // Auto-calculate total_amount
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['tuition_fee', 'hostel_fee', 'library_fee', 'lab_fee', 'other_fees'].includes(name!)) {
        const total = (Number(value.tuition_fee) || 0) + (Number(value.hostel_fee) || 0) + (Number(value.library_fee) || 0) + (Number(value.lab_fee) || 0) + (Number(value.other_fees) || 0);
        form.setValue('total_amount', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  const onSubmit = async (data: FeeRecordFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      // Calculate payment status
      let payment_status: FeeStatus = 'pending';
      if (data.paid_amount >= data.total_amount) {
        payment_status = 'paid';
      } else if (data.paid_amount > 0) {
        payment_status = 'partial';
      }

      const recordData = {
        student_id: data.student_id,
        semester: data.semester,
        year: data.year,
        tuition_fee: data.tuition_fee,
        hostel_fee: data.hostel_fee,
        library_fee: data.library_fee,
        lab_fee: data.lab_fee,
        other_fees: data.other_fees,
        total_amount: data.total_amount,
        paid_amount: data.paid_amount,
        due_date: data.due_date.toISOString().split('T')[0],
        payment_status,
        payment_method: data.payment_method || undefined,
        transaction_id: data.transaction_id || undefined,
        paid_at: data.paid_amount > 0 ? new Date().toISOString() : undefined,
      };

      let newRecord: FeeRecord;
      if (initialData) {
        newRecord = await updateFeeRecord(initialData.id, recordData);
      } else {
        newRecord = await createFeeRecord(recordData);
      }

      onSubmitSuccess(newRecord);
      toast({ title: initialData ? "Record Updated" : "Record Created", description: `Fee record processed.` });
    } catch (error) {
      console.error('Error saving fee record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: "Error", description: `Failed to save fee record: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const [studentSearch, setStudentSearch] = React.useState('');

  const filteredStudents = React.useMemo(() => {
    if (!studentSearch) return students;
    const lowerSearch = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.full_name || '').toLowerCase().includes(lowerSearch) ||
      (s.student_id || '').toLowerCase().includes(lowerSearch) ||
      (s.branch || '').toLowerCase().includes(lowerSearch) ||
      (s.semester || '').toLowerCase().includes(lowerSearch)
    );
  }, [students, studentSearch]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Search and Select */}
        <div className="space-y-2">
          <FormLabel>Student</FormLabel>
          <Input
            placeholder="Search students by name, student ID, branch, or semester..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="mb-2"
          />
          <FormField
            control={form.control}
            name="student_id"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !!initialData}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger></FormControl>
                <SelectContent>
                  {filteredStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_id || s.id}) - {s.branch}, {s.semester}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Semester */}
        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger></FormControl>
                <SelectContent>
                  {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl><Input type="number" placeholder="2024" {...field} disabled={isLoading} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fee Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tuition_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tuition Fee</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hostel_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel Fee</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="library_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Library Fee</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lab_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lab Fee</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="other_fees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Fees</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Total and Paid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paid_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid Amount</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Remaining Due */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            Remaining Due: ₹{form.watch('total_amount') - form.watch('paid_amount')}
          </p>
        </div>

        {/* Due Date */}
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isLoading}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method (Optional)</FormLabel>
              <FormControl><Input placeholder="e.g., Online, Cash" {...field} disabled={isLoading} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transaction ID */}
        <FormField
          control={form.control}
          name="transaction_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction ID (Optional)</FormLabel>
              <FormControl><Input placeholder="Transaction reference" {...field} disabled={isLoading} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Record' : 'Create Record'}
        </Button>
      </form>
    </Form>
  );
}
