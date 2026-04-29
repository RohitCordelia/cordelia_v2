import React, { useEffect, useState, useRef } from 'react'
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../index.css'
import ReadMore from '../../../utils/read';
import Modal from '../../../components/UI/ModalCenter';
const image = [
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/full-course-dining-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/accomodation-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/unlimited-beverages-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/entertainment-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/disco-night-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/casino-mobile.webp',
        "title": ''
    },
    {
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/swimmingpool-mobile.webp',
        "title": ''
    }
]

export default function ShoreExContainer({ shoreEx }: any) {
    const [setting, setSetting] = useState<any>({});
    const [mainFilter, setMainFilter] = useState<any>(false);
    const [isOverFourLines, setIsOverFourLines] = useState(false);
    const [fullDescription, setFullDescription] = useState(false)
    const paragraphRef = useRef(null);

    useEffect(() => {
        window.innerWidth > 640 ? setSetting(settings) : setSetting(sliderSettings)
    }, [])

    const SamplePrevArrow = (props: any) => {
        const { className, onClick } = props;
        return (
            <div onClick={onClick} className={`arrow ${className}`} >
                <img className='drop-shadow-xl h-4 lg:h-8 rotate-90' src='https://www.cordeliacruises.com/assets/icons/footer/chevon-down-black.svg' />
            </div>
        )
    }

    function SampleNextArrow(props: any) {
        const { className, onClick } = props;
        return (
            <div onClick={onClick} className={`arrow ${className}`} >
                <img className='drop-shadow-xl h-4 lg:h-8 -rotate-90' src='https://www.cordeliacruises.com/assets/icons/footer/chevon-down-black.svg' />
            </div>
        )
    }
    const settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: false,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
    };
    const sliderSettings = {
        className: "center",
        centerMode: true,
        infinite: true,
        centerPadding: "20px",
        slidesToShow: 1,
        speed: 1000,
        autoplaySpeed: 5000,
        autoplay: false,
        arrows: false,
        dots: false,
    };

    useEffect(() => {
        if (paragraphRef.current) {
            const lineHeight = parseInt(getComputedStyle(paragraphRef.current).lineHeight);
            const numLines = paragraphRef.current.clientHeight / lineHeight;
            setIsOverFourLines(numLines > 3);
        }
    }, [shoreEx.description]);

    const toggleReadMore = () => {
        setFullDescription(true)
    };

    const DescriptionText = (val:any) => {
        var ret = val.replace(/\\n|\\u/g, '<br/>');
        var ret = ret.replace(/\\r/g, '');
        return <div className='leading-5 lg:leading-6' dangerouslySetInnerHTML={{ __html: ret }}></div>
    }

    return (
        <div className='pt-6 lg:pt-10 px-2'>
            <div className='mobile-slider custom-slider' >
                <Slider {...setting}>
                    {shoreEx.map((val: any, i: any) => {
                        return (
                            <div className=''>
                                <div className='mx-2 rounded shadow-md mb-2'>
                                    <img src={`${val.images[0]}`} className='h-[180px] w-full' alt="" />
                                    <div className='px-4 lg:px-6 text-left py-4 lg:py-6'>
                                        <p className='text-sm lg:text-base font-semibold uppercase'>{val.title}</p>
                                        {/* <ReadMore text={val.description} /> */}
                                        <div
                                            ref={paragraphRef}
                                            style={{
                                                maxHeight: !isOverFourLines ? 'none' : '5.9em',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div className='lg:text-sm text-xs'>
                                                {DescriptionText(val.description)}
                                            </div>
                                        </div>
                                        {isOverFourLines && (
                                            <p className='text-xs cursor-pointer text-brand-primary font-semibold mt-1' onClick={() => setMainFilter(val.description)}>
                                                {'Read More'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    )}
                </Slider>
            </div>

            <Modal show={mainFilter ? true : false} align={'center'} className="max-h-[60%] overflow-y-scroll no-scrollbar drop-shadow bg-white w-[90%] lg:w-2/4 center bottom-1/4 rounded-lg lg:rounded border overflow-hidden left-0 right-0 m-auto" onClose={() => setMainFilter(false)}>
                <div className='border-b border-gray-300 p-4 mb-4 flex items-center justify-between'>
                    <h1 className='text-2xl font-semibold'>Shore Excursion</h1>
                    <svg
                        onClick={() => setMainFilter(false)}
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-black cursor-pointer"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className='text-base px-6 pb-6'>
                    {mainFilter && DescriptionText(mainFilter)}
                </div>
            </Modal>
        </div>
    );
}