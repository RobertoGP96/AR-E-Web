import Introduction from "@/components/about/Introduction";
import { useEffect, useState } from 'react';

const About = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className={`flex-flex-col gap-2 transition-all duration-1000 ${
            isVisible 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
        }`}>
            <Introduction/>
        </div>
    );
};

export default About;