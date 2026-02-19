export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    // Si la fecha es futura
    if (diffInHours < 0) {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es menos de 1 hora
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) {
        return 'Justo ahora';
      }
      return `Hace ${diffInMinutes} min`;
    } 
    // Si es menos de 24 horas
    else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } 
    // Si es más de 24 horas, mostrar fecha completa
    else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


export const formatDayMonth = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
};

export const formatDeliveryDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    // Siempre mostrar fecha completa para deliveries
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting delivery date:', error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha u objeto Date a string YYYY-MM-DD
 * Útil para enviar fechas al backend de Django
 */
export const formatToYYYYMMDD = (date: Date | string | undefined | null): string | undefined => {
  if (!date) return undefined;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return undefined;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};