import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { APIResponse } from '../services/api-response.interface';
import { ErrorHandlerService } from '../services/error-handler.service';

@Component({
  selector: 'app-database-viewer',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTabsModule, MatPaginatorModule, MatDialogModule, MatCheckboxModule, CommonModule, FormsModule],
  templateUrl: './database-viewer.component.html',
  styleUrl: './database-viewer.component.scss'
})
export class DatabaseViewerComponent implements OnInit {
  private apiUrl = window.location.origin.replace('4200', '8000');
  
  tables: any[] = [];
  selectedTable: any = null;
  tableSchema: any[] = [];
  tableData: any = null;
  dbStats: any = null;
  loading = false;
  editingRecord: any = null;
  selectedRecords: Set<any> = new Set();
  
  pageSize = 10;
  pageIndex = 0;
  
  constructor(private http: HttpClient, private dialog: MatDialog, private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    this.loadTables();
    this.loadDatabaseStats();
  }

  loadTables() {
    this.loading = true;
    this.http.get<APIResponse>(`${this.apiUrl}/admin/tables`).subscribe({
      next: (response: APIResponse) => {
        if (response.success && response.data) {
          this.tables = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tables:', this.errorHandler.extractErrorMessage(error));
        this.loading = false;
      }
    });
  }

  loadDatabaseStats() {
    this.http.get<APIResponse>(`${this.apiUrl}/admin/database/stats`).subscribe({
      next: (response: APIResponse) => {
        if (response.success && response.data) {
          this.dbStats = response.data;
        }
      },
      error: (error) => console.error('Error loading database stats:', this.errorHandler.extractErrorMessage(error))
    });
  }

  selectTable(table: any) {
    this.selectedTable = table;
    this.loadTableSchema(table.table_name);
    this.loadTableData(table.table_name);
  }

  loadTableSchema(tableName: string) {
    this.http.get<APIResponse>(`${this.apiUrl}/admin/tables/${tableName}/schema`).subscribe({
      next: (response: APIResponse) => {
        if (response.success && response.data) {
          this.tableSchema = response.data;
        }
      },
      error: (error) => console.error('Error loading table schema:', this.errorHandler.extractErrorMessage(error))
    });
  }

  loadTableData(tableName: string, offset: number = 0) {
    this.loading = true;
    this.http.get<APIResponse>(`${this.apiUrl}/admin/tables/${tableName}/data?limit=${this.pageSize}&offset=${offset}`).subscribe({
      next: (response: APIResponse) => {
        if (response.success && response.data) {
          this.tableData = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading table data:', this.errorHandler.extractErrorMessage(error));
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    const offset = event.pageIndex * event.pageSize;
    if (this.selectedTable) {
      this.loadTableData(this.selectedTable.table_name, offset);
    }
  }

  getDisplayedColumns(): string[] {
    if (!this.tableData || !this.tableData.data || this.tableData.data.length === 0) {
      return [];
    }
    return Object.keys(this.tableData.data[0]);
  }

  getAllColumns(): string[] {
    return [...this.getDisplayedColumns(), 'actions'];
  }

  getColumnsWithSelect(): string[] {
    return ['select', ...this.getDisplayedColumns(), 'actions'];
  }

  refreshData() {
    this.loadTables();
    this.loadDatabaseStats();
    if (this.selectedTable) {
      this.loadTableData(this.selectedTable.table_name, this.pageIndex * this.pageSize);
    }
  }

  editRecord(record: any) {
    this.editingRecord = { ...record };
  }

  saveRecord() {
    if (!this.editingRecord || !this.selectedTable) return;
    
    const primaryKey = this.getPrimaryKeyValue(this.editingRecord);
    if (!primaryKey) {
      alert('No primary key found for this record');
      return;
    }

    this.http.put(`${this.apiUrl}/admin/tables/${this.selectedTable.table_name}/data/${primaryKey}`, this.editingRecord)
      .subscribe({
        next: () => {
          this.editingRecord = null;
          this.loadTableData(this.selectedTable.table_name, this.pageIndex * this.pageSize);
        },
        error: (error) => {
          console.error('Error updating record:', error);
          this.showErrorDialog('Failed to update record: ' + (error.error?.detail || 'Unknown error'));
        }
      });
  }

  cancelEdit() {
    this.editingRecord = null;
  }

  deleteRecord(record: any) {
    if (!this.selectedTable) return;
    
    const primaryKey = this.getPrimaryKeyValue(record);
    if (!primaryKey) {
      this.showErrorDialog('No primary key found for this record');
      return;
    }

    this.showDeleteConfirmation(() => {
      this.http.delete(`${this.apiUrl}/admin/tables/${this.selectedTable.table_name}/data/${primaryKey}`)
        .subscribe({
          next: () => {
            this.loadTableData(this.selectedTable.table_name, this.pageIndex * this.pageSize);
          },
          error: (error) => {
            console.error('Error deleting record:', error);
            this.showErrorDialog('Failed to delete record: ' + (error.error?.detail || 'Unknown error'));
          }
        });
    });
  }

  showDeleteConfirmation(onConfirm: () => void, count: number = 1) {
    const message = count === 1 
      ? 'Are you sure you want to delete this record? This action cannot be undone.'
      : `Are you sure you want to delete ${count} records? This action cannot be undone.`;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: count === 1 ? 'Delete Record' : 'Delete Records',
        message: message,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        onConfirm();
      }
    });
  }

  showErrorDialog(message: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Error',
        message: message,
        confirmText: 'OK',
        cancelText: null
      }
    });
  }

  getPrimaryKeyValue(record: any): any {
    const pkColumn = this.tableSchema.find(col => col.is_primary_key);
    return pkColumn ? record[pkColumn.column_name] : null;
  }

  isEditing(record: any): boolean {
    if (!this.editingRecord) return false;
    const pk = this.getPrimaryKeyValue(record);
    const editingPk = this.getPrimaryKeyValue(this.editingRecord);
    return pk === editingPk;
  }

  toggleRecord(record: any) {
    const pk = this.getPrimaryKeyValue(record);
    if (this.selectedRecords.has(pk)) {
      this.selectedRecords.delete(pk);
    } else {
      this.selectedRecords.add(pk);
    }
  }

  isSelected(record: any): boolean {
    const pk = this.getPrimaryKeyValue(record);
    return this.selectedRecords.has(pk);
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selectedRecords.clear();
    } else {
      this.tableData.data.forEach((record: any) => {
        const pk = this.getPrimaryKeyValue(record);
        this.selectedRecords.add(pk);
      });
    }
  }

  isAllSelected(): boolean {
    return this.tableData?.data?.length > 0 && 
           this.tableData.data.every((record: any) => this.isSelected(record));
  }

  hasSelection(): boolean {
    return this.selectedRecords.size > 0;
  }

  deleteSelected() {
    if (!this.selectedRecords.size) return;

    this.showDeleteConfirmation(() => {
      const deletePromises = Array.from(this.selectedRecords).map(pk => 
        this.http.delete(`${this.apiUrl}/admin/tables/${this.selectedTable.table_name}/data/${pk}`).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        this.selectedRecords.clear();
        this.loadTableData(this.selectedTable.table_name, this.pageIndex * this.pageSize);
      }).catch(error => {
        console.error('Error deleting records:', error);
        this.showErrorDialog('Failed to delete some records');
      });
    }, this.selectedRecords.size);
  }
}