import Introduction from "@/components/about/Introduction";
import Pricing from "@/components/about/price/Pricing";


const About = () => {
    return (
        <div className="flex-flex-col gap-2">
            <Introduction/>
            <Pricing/>
        </div>
    );
};

export default About;