interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'bee' | 'honey';
}

const LoadingSpinner = ({ 
  size = 'md', 
  text = undefined, 
  fullScreen = false,
  variant = 'default'
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerSizeClasses = {
    sm: 'h-16',
    md: 'h-32',
    lg: 'h-64'
  };

  const spinnerColors = {
    default: 'border-primary',
    bee: 'border-bee-500',
    honey: 'border-honey-500'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center'
    : `flex flex-col items-center justify-center ${containerSizeClasses[size]}`;

  return (
    <div className={containerClasses}>
      <div 
        className={`animate-spin rounded-full border-b-2 ${spinnerColors[variant]} ${sizeClasses[size]}`}
      ></div>
      {text && (
        <p className="mt-4 text-base text-muted-foreground font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
