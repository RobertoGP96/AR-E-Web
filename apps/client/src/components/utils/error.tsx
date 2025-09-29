import { CircleAlertIcon } from "lucide-react";

interface ErrorMessageProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

const ErrorMeassage = ({
    text = undefined,
}: ErrorMessageProps) => {

    return (
        <div className="flex flex-row items-center gap-3 justify-center">
            <CircleAlertIcon className="w-6 h-6 text-primary" />
            {text && (
                <p className=" text-base text-muted-foreground font-sm">{text}</p>
            )}
        </div>
    );
};

export default ErrorMeassage;
