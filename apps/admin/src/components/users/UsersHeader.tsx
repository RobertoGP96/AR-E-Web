import { Users } from 'lucide-react';


export default function UsersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-orange-500" />
          Usuarios
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona los usuarios y permisos del sistema
        </p>
      </div>
      
    </div>
  );
}
