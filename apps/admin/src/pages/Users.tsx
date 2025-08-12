import { UsersHeader, UsersFilters, UsersTable } from '@/components/users';
import { useState } from 'react';


const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  


  return (
    <div className="space-y-6">
      <UsersHeader/>
      <UsersFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <UsersTable 
        />
    </div>
  );
};

export default Users;
