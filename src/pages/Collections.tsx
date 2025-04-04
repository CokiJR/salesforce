
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Download, Upload, Plus, Loader2, FileUp, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface Collection {
  id: string;
  invoice_number: string;
  customer_name: string;
  due_date: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  created_at: string;
}

export default function Collections() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  useEffect(() => {
    fetchCollections();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [collections, statusFilter, dateFilter]);
  
  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      setCollections(data || []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch collections: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...collections];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(collection => 
        collection.status === statusFilter
      );
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(collection => {
        const dueDate = new Date(collection.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === filterDate.getTime();
      });
    }
    
    setFilteredCollections(filtered);
  };
  
  const handleAddCollection = () => {
    navigate('/dashboard/collections/add');
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a valid Excel or CSV file",
      });
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Read the file
      const data = await readExcelFile(file);
      
      // Validate data structure
      if (!validateImportData(data)) {
        toast({
          variant: "destructive",
          title: "Invalid data",
          description: "The imported file does not have the required columns",
        });
        return;
      }
      
      // Process and save data
      await processImportData(data);
      
      toast({
        title: "Import successful",
        description: `${data.length} collections have been imported`,
      });
      
      // Refresh the collections list
      fetchCollections();
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset the input
    }
  };
  
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };
  
  const validateImportData = (data: any[]): boolean => {
    if (data.length === 0) return false;
    
    // Check if required columns exist
    const requiredColumns = ['invoice_number', 'customer_name', 'due_date', 'amount'];
    const firstRow = data[0];
    
    return requiredColumns.every(col => 
      Object.keys(firstRow).some(key => 
        key.toLowerCase().includes(col.toLowerCase())
      )
    );
  };
  
  const processImportData = async (data: any[]) => {
    const collections = data.map(row => {
      // Find the appropriate keys in the data
      const getKey = (pattern: string) => {
        const key = Object.keys(row).find(k => 
          k.toLowerCase().includes(pattern.toLowerCase())
        );
        return key ? row[key] : null;
      };
      
      // Extract values
      const invoiceNumber = getKey('invoice');
      const customerName = getKey('customer');
      let amount = getKey('amount');
      let dueDateValue = getKey('due');
      
      // Parse amount to number
      if (typeof amount === 'string') {
        amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
      }
      
      // Parse date
      let dueDate;
      if (dueDateValue) {
        if (typeof dueDateValue === 'string') {
          dueDate = new Date(dueDateValue);
        } else if (typeof dueDateValue === 'number') {
          // Handle Excel date (number of days since Jan 1, 1900)
          dueDate = new Date(Math.round((dueDateValue - 25569) * 86400 * 1000));
        } else {
          dueDate = new Date(dueDateValue);
        }
      } else {
        dueDate = new Date();
      }
      
      return {
        invoice_number: invoiceNumber || 'UNKNOWN',
        customer_name: customerName || 'UNKNOWN',
        amount: isNaN(amount) ? 0 : amount,
        due_date: dueDate.toISOString(),
        status: 'Unpaid'
      };
    });
    
    // Upsert data (update existing or insert new)
    for (const collection of collections) {
      const { error } = await supabase
        .from('collections')
        .upsert(
          [collection],
          { 
            onConflict: 'invoice_number',
            ignoreDuplicates: false
          }
        );
      
      if (error) throw error;
    }
  };
  
  const exportToExcel = () => {
    // Create worksheet from filtered collections
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCollections.map(c => ({
        'Invoice Number': c.invoice_number,
        'Customer Name': c.customer_name,
        'Due Date': format(new Date(c.due_date), 'yyyy-MM-dd'),
        'Amount': c.amount,
        'Status': c.status,
        'Created At': format(new Date(c.created_at), 'yyyy-MM-dd')
      }))
    );
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    
    // Generate Excel file
    const today = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `collections-${today}.xlsx`);
  };
  
  const handlePaymentStatusChange = async (id: string, status: 'Paid' | 'Unpaid') => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setCollections(prev => 
        prev.map(c => c.id === id ? { ...c, status } : c)
      );
      
      toast({
        title: "Status updated",
        description: `Collection marked as ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update status: ${error.message}`,
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            Manage customer payment collections and track due dates
          </p>
        </div>
        <Button onClick={handleAddCollection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Collection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Button 
                      variant="ghost" 
                      className="h-8 w-full"
                      onClick={() => {
                        setDateFilter(undefined);
                        setOpenCalendar(false);
                      }}
                    >
                      Clear date filter
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => {
                      setDateFilter(date);
                      setOpenCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 flex gap-2">
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <Button 
                variant="outline"
                className="whitespace-nowrap"
                onClick={exportToExcel}
                disabled={filteredCollections.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-medium">{collection.invoice_number}</TableCell>
                      <TableCell>{collection.customer_name}</TableCell>
                      <TableCell>{format(new Date(collection.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(collection.amount)}</TableCell>
                      <TableCell>
                        <Badge className={collection.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }>
                          {collection.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {collection.status === 'Unpaid' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePaymentStatusChange(collection.id, 'Paid')}
                          >
                            Mark as Paid
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePaymentStatusChange(collection.id, 'Unpaid')}
                          >
                            Mark as Unpaid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No collections found. Import data or add a new collection.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
