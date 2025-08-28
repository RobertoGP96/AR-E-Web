import Pricing from "@/components/about/price/Pricing";
import ExchangeRate from "@/components/about/price/rage-exchange";

const About = () => {
    return (
        <div className="flex-flex-col gap-2 mt-20">
            <Pricing/>
            <ExchangeRate/>
        </div>
    );
};

export default About;