import React, { useEffect, useState, useRef } from 'react';
import "./index.css"
import "./slick-customized.css"
import { useNavigate } from 'react-router-dom';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface SliderRefType {
    slickGoTo: (index: number) => void;
    slickNext: () => void;
    slickPlay: () => void;
    slickPause: () => void;
}

export default function Banner({ image }: any) {
    const sliderRef = useRef<SliderRefType | null>(null);

    

    const sliderSettings = {
        infinite: false,
        slidesToShow: 1,
        speed: 300,
        dots: true,
    };

    return (
        <>
            <div className="mt-0 homepage-banner">
                <Slider
                    ref={sliderRef}
                    arrows={window.innerWidth > 640 ? true : false}
                    autoplay={true}
                    autoplaySpeed={4500}
                    pauseOnHover={false}
                    {...sliderSettings}
                    className={
                        "bannerCarouselSlider packagesCardSlider"
                    }
                >
                    {image && image.length && image.map((slide: any, index: any) => {
                        let img = ''
                        if(window.innerWidth > 640){
                            img = slide.web
                        }else{
                            img = slide.mobile
                        }
                        return (
                            <div key={index} className='relative'>
                                <img src={img} alt={`Image ${index}`} />
                            </div>
                        )
                    })}
                </Slider>
            </div>
        </>
    );
}
