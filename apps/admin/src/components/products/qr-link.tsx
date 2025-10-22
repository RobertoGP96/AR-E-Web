import React from 'react';
import QRCodeSVG from 'react-qrcode-logo';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { QrCode } from 'lucide-react';

interface QRLinkProps {
  link: string;
}

const QRLink: React.FC<QRLinkProps> = ({ link }) => {
  return (
    <Popover>
      <PopoverTrigger asChild className='p-1'>
        <Button variant="outline" className='cursor-pointer p-0'><QrCode className='w-6 h-6' /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 flex items-center justify-center">
        <QRCodeSVG
        value={link}
        logoImage="/src/assets/logo/logo.svg"
        logoWidth={256 * 0.3}
        logoHeight={256 * 0.3}
        
        eyeRadius={10}
        qrStyle="dots"
      />
      </PopoverContent>
    </Popover>
  );
};

export default QRLink;
