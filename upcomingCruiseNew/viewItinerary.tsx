import React, { useEffect, useState, useRef, useMemo } from 'react';
import moment from 'moment';
import { Layout } from '../../components/Layout';
import { useGetViewItineraryMutation } from '../../services/upcomingCruise/upcomingCruise';
import Banner from './component/banner';
import { useNavigate } from 'react-router-dom';
import CruiseHighlights from './component/cruiseHighlight';
import ShoreExContainer from './component/shoreExContainer';
import { FormatAmount } from '../../utils/formatter/formatter';
import Tooltip from '../../components/UI/Tooltip/ShoreEx';
import { GetManageDetail, GetStore, SaveManageDetail, SaveAuth, GetAuth, SaveStore, GetContact } from '../../utils/store/store';
import './index.css'
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { useSttLoginMutation } from '../../services/auth/auth';
import Button from '../../components/UI/Button';
import SpeakExpert from '../../component/SpeakExpert';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import IdleModal from '../../component/IdleModal';
import { ANALYTICS_EVENTS, trackCustomEvent, trackUserLogin } from '../../services/analytics';
import ProfileAuthV2 from '../profile/authV2';
import { useCreateCouponMutation } from '../../services/cms/cms';
import Modal from '../../components/UI/ModalCenter';
import { useGetUserProfileMutation } from '../../services/profile/profile';
import routeId from './component/routeIds.json';
import CruiseChatbot from '../../components/chatbot/CruiseChatbot';
import { buildItineraryPageContext } from '../../components/chatbot/buildPageContext';
import BottomSheet from '../../component/BottomSheet';
import EMICard from '../../component/EMICard';

const randomString = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const generateCouponCode = () => {
    const cc = `CORD4${randomString(7)}`;
    return cc;
};

type Props = {};

const safeFormatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';

    const match = timeStr.match(/(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm))/);
    if (match) return match[1].toUpperCase();

    const m = moment(timeStr, ['ddd, DD MMM hh:mm A', 'ddd, DD MMM, hh:mm A', 'YYYY-MM-DD h:mm A', 'DD/MM/YYYY hh:mm A', 'hh:mm A']);
    if (m.isValid()) return m.format('hh:mm A');

    return 'N/A';
};

export default function ViewItinerary({ }: any) {
    const store = GetStore();
    const ManageDetail = GetManageDetail();

    const [getViewItinerary] = useGetViewItineraryMutation();
    const [SttLogin] = useSttLoginMutation();
    let navigate = useNavigate();

    const idle = useIdleTimer();

    const action = new window.URLSearchParams(window.location.search).get('action');


    const itineraryId = new window.URLSearchParams(window.location.search).get('id');
    const stt = new window.URLSearchParams(window.location.search).get('stt');
    const authToken = GetAuth()?.token;
    const [isLoading, setIsLoading] = useState<any>();
    const [view, setView] = useState<any>(false);
    const [itineraryData, setItineraryData] = useState<any>();
    const [isFixed, setIsFixed] = useState(false);
    const [marginTop, setMarginTop] = useState('32px');
    const [itineraryName, setItineraryName] = useState<any>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [authModal, setAuthModal] = useState(false);
    const [token, setToken] = useState('');
    const [createCoupon, { isLoading: loadingCreate }] = useCreateCouponMutation();
    const [couponModal, setCouponModal] = useState(false)
    const [couponData, setCouponData] = useState({ per: 0, cc: '' })
    const [couponCopied, setCouponCopied] = useState(false);
    const [pageCode, setPageCode] = useState('');
    const [open, setOpen] = useState(false);
    const [getUserProfile] = useGetUserProfileMutation();
    const [showRevealPriceCTA, setShowRevealPriceCTA] = useState(false);

    const scrollDivRef = useRef(null);

    const createCouponCode = async () => {
        const mobile = GetContact()
        const createdCouponCode = generateCouponCode()
        let couponObject = {
            "description": 'Apply and get instant discount',
            "discount_type": 'Percentage',
            "discount_amount": null,
            "coupon_code": createdCouponCode,
            "portals": ['b2c-normal-flow'],
            "applies_to": ['normal_fare'],
            "discount_pct": 5,
            "max_discount": null,
            "limit_per_user": 1,
            "is_public": false,
            "disable_for_other_offers": false,
            "disable_for_partial_payment": false,
            "active": true,
            "success_message": 'Coupon applied',
            "valid_from": moment().format('YYYY-MM-DD HH:mm:ss ZZ'),
            "valid_till": moment().clone().add(48, 'hours').format('YYYY-MM-DD HH:mm:ss ZZ'),
            "rules_json": [],
            "is_unique": false,
            "phone_number": mobile
        };

        const _payload = {
            coupon: couponObject
        };

        await createCoupon(_payload)
            .unwrap()
            .then((res: any) => {
                if (res?.status == 'success') {
                    setCouponData({
                        per: 5,
                        cc: res?.data?.coupon?.coupon_code
                    })
                    setCouponModal(true)
                } else {

                }

            })
            .catch((res: any) => {
                console.log('Errorsada: ', res);
            });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(couponData?.cc).then(() => {
            setCouponCopied(true);
        });
        setTimeout(() => {
            setCouponCopied(false);
        }, 2000);
    };

    useEffect(() => {
        setToken(authToken);
    }, [GetAuth()]);

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const isViewItineraryRef = useRef(false);

    const botPageContext = useMemo(() => buildItineraryPageContext({
        itineraryData,
        isLoggedIn: !!token,
    }), [itineraryData, token]);

    const embarkationDate = moment(itineraryData?.start_date, 'DD/MM/YYYY');
    const disembarkationDate = moment(itineraryData?.end_date, 'DD/MM/YYYY');

    const rawEmbarkationTime = itineraryData?.ports?.[0]?.embarkation_start_time || itineraryData?.ports?.[0]?.embarkation_start_time;
    const rawDisembarkationTime = itineraryData?.ports?.[itineraryData?.ports?.length - 1]?.arrival;

    const embarkationFormattedTime = rawEmbarkationTime ? moment(rawEmbarkationTime, ['YYYY-MM-DD h:mm A']).format('hh:mm A') : 'N/A';
    const disembarkationFormattedTime = safeFormatTime(rawDisembarkationTime);

    const emiAmount = FormatAmount(Math.round(itineraryData?.actual_per_guest_per_night / 9));
    
    useEffect(() => {
        if (itineraryData && !isViewItineraryRef.current) {
            const portList = itineraryData?.ports?.filter((val: any) => val.name !== 'At Sea').map((val: any) => val.name).join(' | ');

            trackCustomEvent(ANALYTICS_EVENTS.ITINERARY_VIEWED, {
                page_url: window.location.href,
                visiting_ports: portList,
                destination_name: itineraryData?.destination_port?.name,
                no_of_nights: itineraryData?.nights,
                cruise_name: itineraryData?.ship?.name,
                trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                price_starting_from: itineraryData?.starting_fare,
                embarkation_time: embarkationFormattedTime,
                disembarkation_time: disembarkationFormattedTime,
                embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
                shore_excursion_available: itineraryData?.shore_excursions,
                itinerary_id: itineraryData?.id,
                itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
            });
            isViewItineraryRef.current = true;
        }

        if (itineraryData?.route_id && routeId.includes(itineraryData?.route_id) && !token) {
            setShowRevealPriceCTA(true);
        } else {
            setShowRevealPriceCTA(false);
        }
    }, [itineraryData, token]);

    useEffect(() => {
        if (itineraryData?.ports?.length > 0) {
            const allPortNames = itineraryData?.ports?.map(item => ({ name: item?.name }));
            setItineraryName(allPortNames);
        }
    }, [itineraryData]);

    useEffect(() => {
        if (stt && !authToken) {
            const _payload = { refresh_token: stt };
            SttLogin(_payload)
                .unwrap()
                .then((response) => {
                    SaveAuth(response?.data?.login_response);

                    getUserProfile(response?.data?.lead_id)
                        .unwrap()
                        .then((res: any) => {
                            trackUserLogin({
                                userId: `${res?.country_code.split("+")[1]}${res?.phone_number}`,
                                userAttributes: {
                                    phone_number: `${res?.country_code.split("+")[1]}${res?.phone_number}`
                                }
                            })
                        })
                        .catch((res: any) => {
                            console.log('Error: ', res)
                        });
                })
                .catch((response) => {
                    // setError('otp', { type: 'custom', message: response?.message || 'Failed to verify OTP' });
                })
        }
    }, [stt])

    useEffect(() => {
        const handleScroll = () => {
            if (scrollDivRef.current) {
                const scrollTop = window.scrollY;
                if (scrollTop >= 420) {
                    setIsFixed(true);
                    setMarginTop('160px')
                } else {
                    setIsFixed(false);
                    setMarginTop('32px')
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const _payload = {
            itinerary_id: itineraryId
        };
        setIsLoading(true);
        getViewItinerary(_payload)
            .unwrap()
            .then((res: any) => {
                SaveStore({ itinerary: res });
                setItineraryData(res);
                setIsLoading(false);
            })
            .catch((res: any) => {
                setIsLoading(false);
                console.log('Error: ', res);
            });
    }, []);

    const scrollIntoViewWithOffset = (selector: any, offset: any) => {
        const blue = document.getElementById(selector);
        if (blue) {
            let position = blue!.getBoundingClientRect();
            window.scrollTo({ top: position.top + window.scrollY - offset, behavior: 'smooth' });
        }
    }

    const PortCard = ({ port }: any) => {
        return (
            <div className="mb-2">
                <div className="">
                    <div className="flex items-center">
                        <div className="bg-brand-gradient rounded-md flex flex-col w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] items-center justify-center">
                            <p className="text-white text-xs lg:text-sm">Day</p>
                            <p className="text-white text-sm lg:text-lg font-bold">
                                {port.day}
                            </p>
                        </div>
                        <div className="ml-4">
                            <p className="text-base lg:text-xl font-semibold">
                                {port?.name != 'At Sea' ? port?.name + ' Port' : port?.name}
                            </p>
                            <p className="text-xs lg:text-base text-brand-orange-text font-medium mt-0.5">
                                {port?.title}{' '}
                            </p>
                        </div>
                    </div>
                    <div className="py-4 lg:py-8">
                        <p className="text-gray-100 text-xs lg:text-base leading-6">
                            {port.description}
                        </p>
                    </div>
                    {port.images && port.images.length ? (
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            {port.images.map((val: any) => (
                                <div>
                                    <img src={val} alt="" />
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {port.shore_excursions && port.shore_excursions.length ? (
                    <div className="">
                        <div className='flex'>
                            <Tooltip text="A shore excursion is a group tour or activity aimed at cruise travelers who can spend time in each port they're visiting on their itinerary. <br/> All shore excursions are available at an additional cost.">
                                <div className="flex items-center">
                                    <p className="text-xl font-bold">Shore Excursions</p>
                                    <img
                                        className="ml-2 h-6"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/info-purple-icon.svg"
                                        alt=""
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        <div className='mb-8'>
                            <ShoreExContainer shoreEx={port.shore_excursions} />
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    let data = [
        'Inclusive of all meals at Food Court & Starlight Restaurant',
        'Jain food available at Starlight',
        'All inclusive unlimited beverage package'
    ];

    const specialPorts = ['Visakhapatnam', 'Puducherry', 'Chennai', 'Jaffna', 'Hambantota', 'Trincomalee'];

    const inclusionData = [
        {
            night: 2,
            shows: [
                { name: 'Indian Cinemagic', status: true },
                { name: 'Balle Balle', status: true },
                { name: 'Burlesque Show*', status: true },
                { name: 'Romance In Bollywood', status: false },
                { name: 'Magician’s Cut', status: false },
                { name: 'Magical Evening*', status: true },
                { name: 'Magical Workshop*', status: false }
            ]
        },
        {
            night: 3,
            shows: [
                { name: 'Indian Cinemagic', status: true },
                { name: 'Balle Balle', status: true },
                { name: 'Burlesque Show*', status: true },
                { name: 'Romance In Bollywood', status: false },
                { name: 'Magician’s Cut', status: true },
                { name: 'Magical Evening*', status: false },
                { name: 'Magical Workshop*', status: true }
            ]
        },
        {
            night: 4,
            shows: [
                { name: 'Indian Cinemagic', status: true },
                { name: 'Balle Balle', status: true },
                { name: 'Burlesque Show*', status: true },
                { name: 'Romance In Bollywood', status: true },
                { name: 'Magician’s Cut', status: true },
                { name: 'Magical Evening*', status: true },
                { name: 'Magical Workshop*', status: false }
            ]
        },
        {
            night: 5,
            shows: [
                { name: 'Indian Cinemagic', status: true },
                { name: 'Balle Balle', status: true },
                { name: 'Burlesque Show*', status: true },
                { name: 'Romance In Bollywood', status: true },
                { name: 'Magician’s Cut', status: true },
                { name: 'Magical Evening*', status: true },
                { name: 'Magical Workshop*', status: true }
            ]
        },
        {
            night: 10,
            shows: [
                { name: 'Razzmatazz', status: true },
                { name: 'Indian Cinemagic', status: true },
                { name: 'Balle Balle', status: true },
                { name: 'Burlesque Show*', status: true },
                { name: 'Romance In Bollywood', status: true },
                { name: 'Magician’s Cut', status: true },
                { name: 'Magical Evening*', status: true },
                { name: 'Magical Workshop*', status: true }
            ]
        }
    ];

    // Dynamically update the show name if itineraryName matches any of the special ports
    const result = itineraryName?.some(item => specialPorts.includes(item.name));
    if (result) {
        inclusionData.forEach(night => {
            // Iterate through the shows for each night and replace 'Indian Cinemagic' with 'Razzmatazz'
            night.shows = night.shows.map(show => {
                if (show.name === 'Indian Cinemagic' && itineraryData?.nights != 10) {
                    return { ...show, name: 'Razzmatazz' };  // Replace name with 'Razzmatazz'
                }
                return show;
            });
        });
    }


    const Inclusion = () => {
        let inclusion: any = inclusionData.find((data: any) => data.night == itineraryData?.nights);
        return inclusion?.shows?.map((val: any, i: number) => {
            return (
                <div className={`${i == 1 || i == 3 || i == 5 ? 'bg-gray-400' : ''} grid grid-cols-5 gap-[1px]`}>
                    <div className="col-span-3 lg:py-6 py-3 rounded-s-md ">
                        <p className="text-center text-sm lg:text-md font-semibold">
                            {val.name}
                        </p>
                    </div>
                    <div className="col-span-2 rounded-s-md border-l border-gray-300">
                        <div className="py-3 lg:py-3 flex justify-center text-center">
                            <img
                                className="h-6 lg:h-7"
                                src={`${val.status ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/itinerary-tick-icon.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/itinerary-close-icon.svg'}`}
                                alt="rightTick"
                            />
                        </div>
                    </div>
                </div>
            )
        })
    }

    const rescheduleItinerary = (data: any) => {
        SaveManageDetail({
            ...ManageDetail,
            rescheduleBooking: data
        });
        SaveStore({ itinerary: data });
        navigate("/manage-booking/reschedule/select-cabin");
    }

    const ItineraryName = () => {
        if (itineraryData?.nights > 5) {
            return (
                <p className="text-base lg:text-xl font-bold">
                    {itineraryData?.ports[0]?.name} -&nbsp;
                    {itineraryData?.ports[itineraryData?.ports.length - 1]?.name}
                </p>
            )
        } else {
            return (
                itineraryData?.ports.map((val: any, i: number) => (
                    <p key={i} className="text-base lg:text-xl font-bold">
                        {val.name}
                        {i !== itineraryData?.ports.length - 1 && <span> -&nbsp;</span>}
                    </p>
                ))
            )

        }
    }

    const portList = itineraryData?.ports
        .filter((val: any) => val.name !== 'At Sea')
        .map((val: any) => val.name)
        .join(' | ');

    const isLong = portList?.length > 150;

    return (
        <div>
            <div className={`${isFixed ? 'lg:hidden' : ''}`}>
                <Header headerAnimation={''} isVideo={false} />
            </div>
            <main className="pt-[60px] pb-24 lg:pt-[100px] lg:pb-36">
                <Banner image={itineraryData?.banner_img_urls} />
                <div
                    className={`${isFixed ? 'lg:fixed lg:top-[0px]' : ''} lg:w-full lg:shadow py-6 mt-5 lg:mt-0 border bg-white z-10 lg:border-0 border-gray-300 shadow-allSide mx-4 lg:mx-0`}
                    ref={scrollDivRef}
                    style={{
                        transition: 'position 0.3s ease-in-out',
                    }}
                >
                    <div className={`container mx-auto px-4 lg:px-0 lg:flex justify-between gap-8`}>
                        <div className="flex items-center justify-between lg:w-[55%]">
                            <div className="w-full">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-wrap">
                                        {ItineraryName()}
                                        <p className="text-xl font-bold text-brand-primary ml-1 hidden lg:block">
                                            {itineraryData?.nights}N/{itineraryData?.nights + 1}D
                                        </p>
                                    </div>
                                    <p className="text-xs font-bold bg-brand-yellow lg:hidden px-2 py-1.5 rounded">
                                        {itineraryData?.nights}N/{itineraryData?.nights + 1}D
                                    </p>
                                </div>
                                <div className="border-t border-gray-300 mt-5 w-full lg:hidden" />
                                <div className="lg:flex mt-3 lg:mt-3">
                                    <div className="flex items-center mr-6">
                                        <img
                                            className="mr-1 h-6"
                                            src="https://images.cordeliacruises.com/cordelia_v2/public/assets/embark-booking-icon.svg"
                                            alt=""
                                        />
                                        <p className="text-sm lg:text-base font-semibold">
                                            Embarkation:{' '}
                                            <span className="text-brand-primary font-semibold">
                                                {/* {moment(itineraryData?.start_date, 'YYYY-MM-DD hh:mm A').format('MMM Do, hh:mm A')} */}
                                                {moment(itineraryData?.start_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center mt-3 lg:mt-0">
                                        <img
                                            className="mr-1 h-6"
                                            src="https://images.cordeliacruises.com/cordelia_v2/public/assets/disembark-booking-icon.svg"
                                            alt=""
                                        />
                                        <p className="text-sm lg:text-base font-semibold">
                                            Disembarkation:{' '}
                                            <span className="text-brand-primary font-semibold">
                                                {/* {moment(itineraryData?.end_date, 'YYYY-MM-DD hh:mm A').format('MMM Do, hh:mm A')} */}
                                                {moment(itineraryData?.end_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-3 lg:mt-3">
                                    <div className='flex flex-col items-start'>
                                        <p className="text-xs lg:text-sm font-medium text-gray-100">
                                            Visiting Ports:
                                        </p>
                                        <div className="">
                                            <span
                                                className={`text-xs lg:text-sm font-medium !leading-5`}
                                            >
                                                <span className="text-xs lg:text-sm font-medium !leading-5">
                                                    {isLong && !isExpanded ? portList?.slice(0, 60) + '...' : portList}
                                                </span>
                                            </span>
                                            {isLong && (
                                                <span
                                                    onClick={() => setIsExpanded(prev => !prev)}
                                                    className="text-xs lg:text-sm text-brand-primary font-bold ml-2 cursor-pointer inline-block"
                                                >
                                                    {isExpanded ? 'View less' : 'View more'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center cursor-pointer mt-3 lg:mt-3 lg:hidden"
                                    onClick={() => {
                                        navigate('/upcoming-cruises');
                                        trackCustomEvent(ANALYTICS_EVENTS.CHANGE_ITINERARY_CLICKED, {
                                            page_url: window.location.href,
                                            visiting_ports: portList,
                                            destination_name: itineraryData?.destination_port?.name,
                                            no_of_nights: itineraryData?.nights,
                                            cruise_name: itineraryData?.ship?.name,
                                            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                                            price_starting_from: itineraryData?.starting_fare,
                                            embarkation_time: embarkationFormattedTime,
                                            disembarkation_time: disembarkationFormattedTime,
                                            embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(','),
                                            shore_excursion_available: itineraryData?.shore_excursions,
                                            itinerary_id: itineraryData?.id,
                                            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                                        });
                                    }}
                                >
                                    <p className="text-sm lg:text-lg font-medium text-brand-blue-2">
                                        Change Itinerary
                                    </p>
                                    <img
                                        className="h-4 lg:h-6 ml-2"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/edit-itinerary-icon.svg"
                                        alt=""
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='border-l border-gray-300 hidden lg:block' />
                        <div className=' hidden lg:flex justify-end w-[45%] gap-5'>
                            {!showRevealPriceCTA && <div className={token ? 'w-full' : ''}>
                                {token && 
                                    <>
                                        <p className='text-xxs lg:text-xs text-gray-1100'>Starting From</p>
                                        <div className='flex gap-2 items-baseline'>
                                            {itineraryData?.discount_pct != 0 ?
                                                <p className='text-base text-gray-1100 line-through ml-1'>₹{FormatAmount(itineraryData?.actual_starting_fare)}</p>
                                                : null
                                            }
                                            <p className={`text-lg font-bold ${showRevealPriceCTA ? 'blur-[6px]' : ''}`}>₹{FormatAmount(itineraryData?.starting_fare)}</p>
                                        </div>
                                        <p className='text-xs text-gray-1100'>Excl. GST PP in Double Occupancy</p>
                                    </>
                                }
                                {!showRevealPriceCTA && <div onClick={() => setOpen(true)} className="mt-1 lg:mt-2 p-2 rounded-md bg-gray-400 w-max cursor-pointer">
                                    <p className={`mt-2 lg:mt-1 font-medium flex justify-center items-center gap-1 ${token ? 'text-xxs' : 'text-base mb-2'}`}>No-Cost EMI starts at</p>
                                    <p className={`inline-flex items-center gap-1 w-full justify-center text-brand-primary font-bold whitespace-nowrap ${token ? 'text-xl' : 'text-3xl'}`}>
                                        ₹{emiAmount}
                                        <span className="text-xxs lg:text-xs font-normal text-gray-1100">/month</span>
                                        <span className='inline-block'>
                                            <button
                                                type="button"
                                                onClick={() => setOpen(true)}
                                                className="flex items-center cursor-pointer"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
                                                    <circle cx="6" cy="6" r="4.625" stroke="currentColor" strokeWidth="0.75" />
                                                    <path
                                                        d="M6 3.85736L6 6.71343"
                                                        stroke="currentColor"
                                                        strokeWidth="0.75"
                                                        strokeLinecap="round"
                                                    />
                                                    <path
                                                        d="M6 8.12665L6 8.14265"
                                                        stroke="currentColor"
                                                        strokeWidth="0.75"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </p>
                                </div>}
                            </div>}
                            <div className='flex flex-col justify-center items-center'>
                                <div className="hidden lg:block ">
                                    {action === 'reschedule' ? (
                                        <Button
                                            text="RESCHEDULE"
                                            size="base"
                                            handleClick={() => rescheduleItinerary(itineraryData)}
                                            className="min-w-[140px] w-[200px]"
                                        />
                                    ) : (
                                        <Button
                                            text="View Cabins"
                                            size="medium"
                                            handleClick={() => {
                                                if (token) {
                                                    navigate('/upcoming-cruises/selectcabin?id=' + itineraryId, { state: { itineraryData, cta: 'view cabins', embarkationDate: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A', disembarkationDate: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A', embarkationTime: embarkationFormattedTime, disembarkationTime: disembarkationFormattedTime } });
                                                } else {
                                                    setPageCode('view_cabin')
                                                    setAuthModal(true);
                                                }
                                            }}
                                            className="w-[200px]"
                                        />
                                    )}
                                </div>
                                <div
                                    className="flex items-center cursor-pointer mt-3 lg:mt-3"
                                    onClick={() => {
                                        navigate('/upcoming-cruises');
                                        trackCustomEvent(ANALYTICS_EVENTS.CHANGE_ITINERARY_CLICKED, {
                                            page_url: window.location.href,
                                            visiting_ports: portList,
                                            destination_name: itineraryData?.destination_port?.name,
                                            no_of_nights: itineraryData?.nights,
                                            cruise_name: itineraryData?.ship?.name,
                                            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way',
                                            price_starting_from: itineraryData?.starting_fare,
                                            embarkation_time: embarkationFormattedTime,
                                            disembarkation_time: disembarkationFormattedTime,
                                            embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(','),
                                            shore_excursion_available: itineraryData?.shore_excursions,
                                            itinerary_id: itineraryData?.id,
                                            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias ||"",
                                        });
                                    }}
                                >
                                    <p className="text-sm lg:text-lg font-medium text-brand-blue-2">
                                        Change Itinerary
                                    </p>
                                    <img
                                        className="h-4 lg:h-6 ml-2"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/edit-itinerary-icon.svg"
                                        alt=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${innerWidth > 768 ? 'container mx-auto' : ''} px-4 lg:px-0`} style={{
                    marginTop: marginTop
                }}>
                    <div className="shadow-allSide rounded-lg">
                        <div className="px-4 lg:px-8 py-4 lg:py-8 border-b border-gray-300">
                            <p className="text-base lg:text-2xl font-bold">
                                Your Cruise Highlight
                            </p>
                        </div>
                        <div className="pb-4 mt-6 lg:mt-8">
                            <CruiseHighlights />
                        </div>
                    </div>

                    <div className={` ${!view ? 'relative overflow-hidden lg:h-[740px] h-[600px]' : null} pb-3 shadow-allSide rounded-lg mt-4 `} >
                        <div className="px-4 lg:px-8 py-4 lg:py-8 border-b border-gray-300">
                            <p className="text-base lg:text-2xl font-bold">Itinerary</p>
                            <p className="text-sm lg:text-base font-normal text-gray-100 mt-2">
                                Day wise details of your package
                            </p>
                        </div>
                        <div className="px-4 lg:px-8 mt-10" id='itinerary'>
                            {itineraryData?.ports?.map((val: any, i: number) => (
                                <PortCard port={val} />
                            ))}
                        </div>
                        {!view ?
                            <>
                                <div className="cloudy-effect absolute bottom-0 left-0 w-full h-20"></div>
                                <div
                                    style={{
                                        background: 'linear-gradient(0deg, rgb(255 255 255) 60%, rgb(255 255 255 / 40%) 100%, rgb(255 255 255 / 0%) 100%)'
                                        // background: '#ccc'
                                    }}
                                    className="absolute bottom-4 left-3 w-full flex flex-wrap gap-2 cursor-pointer items-center"
                                    onClick={() => {
                                        setView(!view);
                                        trackCustomEvent(ANALYTICS_EVENTS.FULL_ITINERARY_VIEWED, {
                                            page_url: window.location.href,
                                            visiting_ports: portList,
                                            destination_name: itineraryData?.destination_port?.name,
                                            no_of_nights: itineraryData?.nights,
                                            cruise_name: itineraryData?.ship?.name,
                                            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                                            price_starting_from: itineraryData?.starting_fare,
                                            embarkation_time: embarkationFormattedTime,
                                            disembarkation_time: disembarkationFormattedTime,
                                            embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(','),
                                            shore_excursion_available: itineraryData?.shore_excursions,
                                            itinerary_id: itineraryData?.id,
                                            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                                        });
                                    }}
                                >
                                    <p className="text-brand-blue-2 font-semibold ml-6 text-sm lg:text-lg underline ">{`View Full Itinerary`}</p>
                                    <img className='h-4 lg:h-6 mt-1' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/click-arrow-booking.svg" />
                                </div>
                            </>
                            : null
                        }
                        {view ?
                            <div className="flex flex-wrap gap-2 items-center cursor-pointer mb-4 " onClick={() => {
                                setView(!view)
                                scrollIntoViewWithOffset('itinerary', 260)
                            }}>
                                <p className="text-brand-blue-2 font-semibold ml-6 text-sm lg:text-lg underline ">{`Hide Itinerary`}</p>
                                <img className='h-4 lg:h-6 mt-1' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/click-arrow-booking.svg" />
                            </div>

                            : null}
                    </div>

                    {itineraryData?.ship?.code?.toLowerCase() === "empress" && <div className="grid grid-cols-10 mb-4 gap-4 mt-5 rounded-sm">
                        <div className="col-span-10 lg:col-span-5  lg:py-6 py-4  shadow-allSide rounded-md">
                            <div className='px-4 lg:px-8'>
                                <p className="text-base lg:text-2xl font-bold">Inclusions</p>
                            </div>
                            <div className="border-b border-gray-300 mx-4 my-4"></div>
                            <div className="lg:mx-6 mx-6 lg:mt-4">
                                {data?.map((data: any) => (
                                    <div className='flex items-start mb-2'>
                                        <img
                                            className='h-6 lg:h-8 mr-2'
                                            src="https://images.cordeliacruises.com/cordelia_v2/public/assets/access-tick-booking.svg"
                                            alt="rightTick"
                                        />
                                        <p className="text-sm lg:text-base text-gray-100">
                                            {data}
                                        </p>
                                    </div>
                                ))}
                                <p className="text-brand-secondary font-semibold mt-1 ml-8 text-xs lg:text-sm italic">
                                    Note: Regular beverage package included.*
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-end">
                                <a target='_blank' href="https://images.cordeliacruises.com/cordelia_v2/public/pdf/empress-inclusion-exclusion-new-march-2025.pdf" onClick={() => {
                                    trackCustomEvent(ANALYTICS_EVENTS.VIEW_INCLUSIONS_AND_EXCLUSIONS, {
                                        page_url: window.location.href,
                                        visiting_ports: portList,
                                        destination_name: itineraryData?.destination_port?.name,
                                        no_of_nights: itineraryData?.nights,
                                        cruise_name: itineraryData?.ship?.name,
                                        trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way',
                                        price_starting_from: itineraryData?.starting_fare,
                                        embarkation_time: embarkationFormattedTime,
                                        disembarkation_time: disembarkationFormattedTime,
                                        embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                                        disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                                        offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(','),
                                        shore_excursion_available: itineraryData?.shore_excursions,
                                        itinerary_id: itineraryData?.id,
                                        itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                                        pdf: "https://images.cordeliacruises.com/cordelia_v2/public/pdf/empress-inclusion-exclusion-new-march-2025.pdf"
                                    });
                                }} className="text-brand-blue-2 font-semibold ml-6 mt-5 text-sm lg:text-lg underline ">{`View Inclusions & Exclusions`}</a>
                                <img className='h-6' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/click-arrow-booking.svg" />
                            </div>
                        </div>

                        <div className="col-span-10 lg:col-span-5 shadow-allSide border border-gray-300 rounded-t-md">
                            <div className="grid grid-cols-5 rounded-sm bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B]">
                                <div className="col-span-3 lg:py-6 py-3 rounded-tl-md ">
                                    <p className="text-center text-sm lg:text-lg font-semibold text-white ">
                                        Entertainment Shows
                                    </p>
                                </div>
                                <div className="col-span-2 lg:py-6 py-3 ml-[1px] rounded-tr-md border-l border-white">
                                    <p className="text-center text-sm lg:text-lg font-semibold text-white">
                                        {itineraryData?.nights} Night
                                    </p>
                                </div>
                            </div>
                            <Inclusion />
                        </div>
                    </div>}
                </div>
            </main>

            <div className='fixed w-full bottom-0 bg-white z-[29] lg:hidden shadow-[rgba(0,0,0,0.14)_5px_-2px_5px]'>
                <div className='bg-white px-4 py-1 '>
                    <div className={`flex items-center mb-4 ${showRevealPriceCTA ? 'justify-end' : 'justify-between'}`}>
                        {!showRevealPriceCTA && <div>
                            <div>
                                {token && 
                                    <>
                                        <p className='text-xxs text-gray-1100'>Starting From</p>
                                        <div className='flex items-center gap-2'>
                                            {itineraryData?.discount_pct != 0 ?
                                                <p className='text-xs text-gray-1100 line-through ml-1'>₹{FormatAmount(itineraryData?.actual_starting_fare)}</p>
                                                : null
                                            }
                                            <p className='text-sm font-bold'>₹{FormatAmount(itineraryData?.starting_fare)}</p>
                                        </div>
                                        <p className='text-xxs text-gray-1100'>Excl. GST PP in Double Occupancy</p>
                                    </>
                                }
                                {!showRevealPriceCTA && <p onClick={() => setOpen(true)} className="text-[8px] lg:text-xs mt-1.5 lg:mt-2 font-semibold text-gray-1100 bg-gray-400 rounded-md px-1.5 inline-flex gap-1 items-baseline">
                                    No-Cost EMI starts at{" "}
                                    <span className="inline items-center gap-1 text-brand-primary text-base font-bold whitespace-nowrap">
                                        ₹{emiAmount}{" "}
                                        <span className="text-[8px] text-gray-1100 font-normal">/month</span>
                                        <button
                                            type="button"
                                            onClick={() => setOpen(true)}
                                            className="inline-flex items-center cursor-pointer ml-1"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="12"
                                                height="12"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                className='w-[10px] h-[10px]'
                                            >
                                                <circle cx="6" cy="6" r="4.625" stroke="currentColor" strokeWidth="0.75" />
                                                <path
                                                    d="M6 3.85736L6 6.71343"
                                                    stroke="currentColor"
                                                    strokeWidth="0.75"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M6 8.12665L6 8.14265"
                                                    stroke="currentColor"
                                                    strokeWidth="0.75"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </p>}
                            </div>
                        </div>}
                        <div className=''>
                            {action === 'reschedule' ? (
                                <Button
                                    text="RESCHEDULE"
                                    size="sm"
                                    handleClick={() => rescheduleItinerary(itineraryData)}
                                />
                            ) : (
                                <Button
                                    text="View Cabins"
                                    size="sm"
                                    handleClick={() => {
                                        if (token) {
                                            navigate('/upcoming-cruises/selectcabin?id=' + itineraryId, { state: { itineraryData, cta: 'view cabins', embarkationDate: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A', disembarkationDate: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A', embarkationTime: embarkationFormattedTime, disembarkationTime: disembarkationFormattedTime } });
                                        } else {
                                            setPageCode('view_cabin')
                                            setAuthModal(true);
                                        }
                                    }}
                                    btnStyle={{
                                        textWrap: 'nowrap'
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
           <div className={`fixed bottom-20 right-4 border z-[99]
    ${token && authToken ? "lg:bottom-1" : "lg:bottom-[5.2rem]"}
  `}>
                <SpeakExpert
                    title={
                        <p
                            style={{
                                background: '-webkit-linear-gradient(#92278F, #EA725B)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                            className='font-playfairDisplay italic font-extrabold text-lg mb-2'
                        >
                            Planning a Cruise Holiday?
                        </p>
                    }
                    subTitle={
                        <p className='text-sm font-semibold mb-2'>
                            Our Cruise Experts help you pick the best itinerary, offers, and cabins available
                        </p>
                    }
                    initOpen={window.innerWidth < 765 ? true : false}
                    isLoggedIn={token ? true : false}
                    setAuthModal={setAuthModal}
                />
            </div>
            <IdleModal
                initOpen={idle?.isIdle}
                title='Still deciding where to cruise? Get curated guidance from a specialist.'
                subTitle='Let our expert match you with an itinerary that suits your taste.'
                isLoggedIn={token ? true : false}
                setAuthModal={setAuthModal}
                onClose={idle.resumeTimer}
            />
            <ProfileAuthV2
                authModal={authModal}
                pageCode={pageCode != '' ? pageCode : 'idle_login'}
                setAuthModal={() => setAuthModal(false)}
                callback={() => {
                    if (token) {
                        navigate('/upcoming-cruises/selectcabin?id=' + itineraryId);
                    } else {
                        createCouponCode();
                    }
                }}
                title={
                    <div className='flex text-[1.4rem] gap-3 items-center'>
                        <p
                            style={{
                                background: '-webkit-linear-gradient(#92278F, #EA725B)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                            className='font-playfairDisplay italic font-extrabold'
                        >
                            Login Now
                        </p>
                        <p className='font-playfairDisplay'>to get attractive offers</p>
                    </div>
                }
                subTitle="You will receive a 4-digit code for your mobile number verification."
                itineraryId={itineraryId}
            />
            <Modal show={couponModal} align={'center'} mainClassName='!z-[10000]' className=" w-full lg:w-[30%] center overflow-hidden left-0 right-0 m-auto top-0 bottom-0 relative"
                onClose={() => {
                    setCouponModal(false)
                    navigate('/upcoming-cruises/selectcabin?id=' + itineraryId)
                }}
            >
                <div className='flex items-center justify-center p-4 pb-0 absolute right-3 top-0 z-[1] w-[30px] h-[30px]'>
                    <p className='text-base lg:text-xl font-bold cursor-pointer' onClick={() => {
                        setCouponModal(false)
                        navigate('/upcoming-cruises/selectcabin?id=' + itineraryId)
                    }}>X</p>
                </div>
                <div className='overflow-scroll no-scrollbar px-2 lg:px-6 py-2 lg:py-6 bg-white rounded-lg'>
                    <img className='absolute top-0 left-0 right-0 w-full' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/Confetti_success.svg" alt="" />
                    <div className=" flex gap-3 justify-center self-center px-2">
                        <p className='text-xl font-bold font-playfairDisplay'>You Got </p>
                    </div>
                    <div className='text-center'>
                        <p
                            style={{
                                background: '-webkit-linear-gradient(#92278F, #EA725B)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                            className='text-[1.5rem] font-playfairDisplay italic font-extrabold'
                        >
                            {couponData?.per}% Extra OFF!
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-center my-6">
                        <div className='col-span-3 border-1 roudned border-dashed border-gray-200 py-6 px-10 rounded-md text-center'>
                            <p className='text-sm text-gray-100 font-semibold'>Use Coupon Code</p>
                            <p
                                style={{
                                    background: '-webkit-linear-gradient(#EA725B, #92278F)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                                className='text-[1.4rem] font-bold'
                            >
                                {couponData?.cc}
                            </p>
                        </div>
                        <div onClick={() => handleCopy()} className='flex items-center justify-center gap-2 mt-2 z-[1] cursor-pointer'>
                            <p className={`${couponCopied ? 'text-brand-green' : 'text-brand-primary'} font-bold underline`}>{couponCopied ? 'Copied!' : 'Copy Code'}</p>
                            <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/Copy_offer_icon1.svg" alt="" />
                        </div>
                    </div>
                    <div className='flex justify-center mb-2'>
                        <Button
                            disabled={loadingCreate}
                            handleClick={() => navigate('/upcoming-cruises/selectcabin?id=' + itineraryId)}
                            text='Complete Your Booking'
                            size='sm'
                            className='rounded-full !px-14'
                        />
                    </div>
                    <div className="text-center lg:px-8 px-4 text-xs text-gray-100 leading-6">
                        <p>
                            At payment, apply this code for extra savings. <br /> Valid for 48 hours.
                        </p>
                    </div>
                </div>
            </Modal>
            {window.innerWidth < 768 ? <BottomSheet isOpen={open} setIsOpen={setOpen} title="No-Cost EMI Details" onClose={() => setOpen(false)} hasBtns={false} >
                <EMICard emiTotalAmount={Math.round(itineraryData?.actual_per_guest_per_night)} />
            </BottomSheet> : 
            <Modal
                show={open}
                align={'center'}
                className="drop-shadow bg-white w-full lg:w-1/2 center lg:top-1/5 bottom-0 lg:bottom-1/6 lg:left-1/3 left-4 lg:h-auto lg:max-h-[80%] overflow-auto rounded-none lg:rounded-lg border"
                mainClassName="!px-0 !items-end lg:!items-center"
                onClose={() => {
                    setOpen(false);
                }}
            >
                <div className='border-b border-gray-300 p-4 flex items-center justify-between sticky top-0 bg-white z-30'>
                    <div className='w-full'>
                        <h1 className='text-xl font-bold font-inter'>No-Cost EMI Details</h1>
                    </div>
                    <svg
                        onClick={() => {
                            setOpen(false);
                        }}
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
                <EMICard emiTotalAmount={Math.round(itineraryData?.actual_per_guest_per_night)} />
            </Modal>}
            <CruiseChatbot pageContext={botPageContext} />
            <Footer />
        </div>
    );
}
