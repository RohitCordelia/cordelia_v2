import React, { useEffect, useState } from 'react'
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const image = [
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/all-inclusive-beverage-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/disco-night-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/entertainment-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/gym-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/rock-climb-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/shopping-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/swimming-pool-highlight-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/video-arcade-highlight-mobile.webp',
        "title": ''
    }
]

export default function CruiseHighlights({ }: any) {
    const [setting, setSetting] = useState<any>({});
    
    useEffect(() => {
        window.innerWidth > 640 ? setSetting(settings) : setSetting(sliderSettings)
    }, [])

    const settings = {
        className: "center",
        centerMode: true,
        infinite: true,
        centerPadding: window.innerWidth > 640 ? "70px" : "30px",
        slidesToShow: 3,
        speed: 1000,
        autoplaySpeed: 3000,
        autoplay: true,
        arrows: true,
        dots: false,
    };
    const sliderSettings = {
        className: "center",
        centerMode: true,
        infinite: true,
        centerPadding: window.innerWidth > 640 ? "100px" : "60px",
        slidesToShow: 1,
        speed: 1000,
        autoplaySpeed: 3000,
        autoplay: true,
        arrows: true,
        dots: false,
    };
    return (
        <div>

            <div className='mobile-slider cabin mb-0 lg:mb-4 lg:px-0 px-4'>
                <Slider
                    {...setting}
                >
                    {image.map((val: any, i: any) => {
                        return (
                            <div>
                                <div className='lg:flex mr-4 lg:mr-4 cursor-pointer shadow-box rounded-lg bg-white'>
                                    <div className='w-full'>
                                        <img className='h-full w-full rounded-t' src={val.image} alt="" />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    )}
                </Slider>
            </div>
        </div>
    );
}