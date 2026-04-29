import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Layout } from '../../components/Layout';
import Modal from '../../components/UI/ModalCenter';
import { useGetItineraryListMutation } from '../../services/upcomingCruise/upcomingCruise';
import "./index.css";
import ItineraryCardNew from './component/itineraryCardNew';
import moment from 'moment';
import { GetAuth, SaveAB, GetAB, SaveAuth, SaveContact, GetContact } from '../../utils/store/store';
import useHorizontalScroll from '../../utils/customHooks/useHorizontalScroll';
import { useSttLoginMutation } from '../../services/auth/auth';
import Button from '../../components/UI/Button';
import CallbackSide from './component/callbackSide';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import IdleModal from '../../component/IdleModal';
import RequestCallbackModal from '../../component/RequestCallbackModal';
import { ANALYTICS_EVENTS, trackCustomEvent, trackUserLogin } from '../../services/analytics';
import ProfileAuthV2 from '../profile/authV2';
import { useCreateCouponMutation } from '../../services/cms/cms';
import { useGetUserProfileMutation } from '../../services/profile/profile';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../../component/BottomSheet';
import { Benefits, GetShortDesc } from '../homepage/components/BenefitsData';
import BenefitsModalContent from '../homepage/components/BenefitsModelContent';
import Slider from 'react-slick';
import CruiseChatbot from '../../components/chatbot/CruiseChatbot';
import { useChatbotFilters } from '../../components/chatbot/useChatbotFilters';

const randomString = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};
const generateCouponCode = () => {
    const cc = `CORD4${randomString(7)}`;
    return cc;
};

const leadsBannerImages = [
    {
        desktop: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Desktop_960x136_find_a_cruise_mid_scroll.webp',
        mobile: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Mobile_563x308_find_a_cruise_mid_scroll.webp',
        type: 'snpl',
        link: '/sail-now-pay-later',
    },
    {
        desktop: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Desktop_960x136_Inclusions_compressed.webp',
        mobile: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Mobile_563x308_Inclusions.webp',
    },
    {
        desktop: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Desktop_960x136_International_Sailings.webp',
        mobile: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Mobile_563x308_International_Sailings.webp',
    },
    {
        desktop: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Desktop_960x136_Popular_Destinations.webp',
        mobile: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Mobile_563x308_Popular_Destination.webp',
    },
    {
        desktop: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Desktop_960x136_Weekend_Cruises.webp',
        mobile: 'https://images.cordeliacruises.com/cordelia_v2/public/images/Mobile_563x308_Weekend_Cruises.webp',
    }
];

type Props = {
}

const slickSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    autoplay: true,
    speed: 500,
    cssEase: "ease-in-out",
    slidesToShow: 2.1,
    slidesToScroll: 1,
    swipeToSlide: true,
    pauseOnHover: true,
    centerMode: false,
    responsive: [
    {
      breakpoint: 360, // below 360px (very small phones)
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 400, // 360px–400px (small phones like 375px)
      settings: {
        slidesToShow: 2.1,
      },
    },
    {
      breakpoint: 480, // 400px–480px (standard phones)
      settings: {
        slidesToShow: 2.1,
      },
    },
    {
      breakpoint: 640, // 480px–640px (large phones)
      settings: {
        slidesToShow: 2.5,
      },
    },
    {
      breakpoint: 768, // 640px–768px (very large phones / small tablets)
      settings: {
        slidesToShow: 3,
      },
    },
  ],
};

export type RegistrationFormFields = {
    firstName: string;
    countryCode: string;
    phoneNumber: string;
};

const monthMap: any = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "April",
    "05": "May", "06": "June", "07": "July", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
};

const MonthDropdown = ({ availableDates, tempMonthFilter, setTempMonthFilter, setActiveFilter }: any) => {
    const monthByYear = useMemo(() => {
        const result: any = {};
        availableDates && availableDates?.forEach((d: any) => {
            const [mm, yyyy] = d.split("-");
            if (!result[yyyy]) result[yyyy] = [];
            result[yyyy].push({ key: d, label: monthMap[mm], mm });
        });
        return result;
    }, []);

    const years = Object.keys(monthByYear).sort();
    const [activeYearIndex, setActiveYearIndex] = useState(0);
    const activeYear = years[activeYearIndex];
    const selectedMonths = monthByYear[activeYear] || [];

    const toggleMonth = (monthKey: any) => {
        setTempMonthFilter((prev: any) => prev.includes(monthKey) ? prev.filter((m: any) => m !== monthKey) : [...prev, monthKey]
        );
    };

    return (
        <div className="absolute top-20 left-0 z-[21] bg-white p-4 rounded-xl shadow-lg w-[400px]">
            <h3 className="font-semibold mb-4">Which month would you prefer to cruise?</h3>
            <div className="flex justify-center items-center mb-4">
                <button
                    onClick={() => setActiveYearIndex(i => Math.max(i - 1, 0))}
                    disabled={activeYearIndex === 0}
                    className='rotate-90 disabled:opacity-40'
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <span className="text-lg font-semibold px-8">{activeYear}</span>
                <button
                    onClick={() => setActiveYearIndex(i => Math.min(i + 1, years.length - 1))}
                    disabled={activeYearIndex === years.length - 1}
                    className='-rotate-90 disabled:opacity-40'
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {selectedMonths.map(({ key, label }: any) => (
                    <div
                        key={key}
                        onClick={() => toggleMonth(key)}
                        className={`text-xs font-medium px-4 py-2 rounded border-gray-100/5 cursor-pointer text-center ${tempMonthFilter.includes(key) ? "bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white" : "bg-gray-100/10 hover:bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-black hover:text-white"}`}
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-4 gap-4">
                {/* <button onClick={() => setTempMonthFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                <button onClick={() => setActiveFilter(null)} className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold">Done</button> */}
                <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempMonthFilter([])} className='w-1/2' />
                <Button text='DONE' size='sm' handleClick={() => setActiveFilter(null)} className='w-full' />
            </div>
        </div>
    );
};

export default function UpcomingCruise({}: Props) {
    const monthParam = new window.URLSearchParams(window.location.search).get('m');
    const yearParam = new window.URLSearchParams(window.location.search).get('y');
    const datesParam = new window.URLSearchParams(window.location.search).get('dates');
    const dateAfterParam = new window.URLSearchParams(window.location.search).get('da');
    const dateBeforeParam = new window.URLSearchParams(window.location.search).get('db');
    const startSelector = new window.URLSearchParams(window.location.search).get('start');
    const portSelector = new window.URLSearchParams(window.location.search).get('port');
    const nightSelector = new window.URLSearchParams(window.location.search).get('n');
    const cruiseSelector = new window.URLSearchParams(window.location.search).get('cruise');
    const stt = new window.URLSearchParams(window.location.search).get('stt');
    const destinationPortsSelector = new window.URLSearchParams(window.location.search).get('destinationPorts');
    const itinerarySelector = new window.URLSearchParams(window.location.search).get('itinerary_id');
    const tripTypeParam = new window.URLSearchParams(window.location.search).get('trip_type');

    const AUTH = GetAuth();
    const ab = GetAB();
    const [token, setToken] = React.useState('');

    const filterRef = useRef(null);
    const [getItinerary] = useGetItineraryListMutation();
    const [SttLogin] = useSttLoginMutation();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [itineraryData, setItineraryData] = useState<any>();
    const [portsList, setPortsList] = useState<any>();
    const [shipsList, setShipsList] = useState<any>();
    const [nightList, setNightList] = useState<any>();
    const [availableDates, setAvailableDates] = useState<any>();
    const [activeFilter, setActiveFilter] = useState<any>(null);

    const [tempDestinationFilter, setTempDestinationFilter] = useState<any>([]);
    const [tempCruiseFilter, setTempCruiseFilter] = useState<any>([]);
    const [tempNoOfNightFilter, setTempNoOfNightFilter] = useState<any>([]);
    const [tempMonthFilter, setTempMonthFilter] = useState<any>([]);
    const [tempOriginFilter, setTempOriginFilter] = useState<any>([]);
    const [tempTripTypeFilter, setTempTripTypeFilter] = useState<any>(tripTypeParam ? tripTypeParam.split(',') : []);
    const [showStripeHeader, setShowStripeHeader] = useState(true);
    const [stripeHeight, setStripeHeight] = useState<number | null>(null);
    const [destinationFilter, setDestinationFilter] = useState<any>([]);
    const [cruiseFilter, setCruiseFilter] = useState<any>([]);
    const [noOfNightFilter, setNoOfNightFilter] = useState<any>([]);
    const [monthFilter, setMonthFilter] = useState<any>([]);
    const [originFilter, setOriginFilter] = useState<any>([]);
    const [tripTypeFilter, setTripTypeFilter] = useState<any>(tripTypeParam ? tripTypeParam.split(',') : []);
    const [filterApplied, setFilterApplied] = useState<any>(false);

    const [sortByPopover, setSortByPopover] = useState(false);
    const [sortByFilter, setSortByFilter] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<string | null>(null);

    const [params, setParams] = useState<string>('');

    const [mainMobileFilterModal, setMainMobileFilterModal] = useState<boolean>(false);
    const [secondaryMobileFilterModal, setSecondaryMobileFilterModal] = useState<any>(null);
    const [mainFilter, setMainFilter] = useState<boolean>(false);
    const [isOpenNewSortAndFilter, setIsOpenNewSortAndFilter] = useState(false);
    const [tripType, setTripType] = useState<any>();
    const [origin, setOrigin] = useState<any>();
    const [activeSortAndFilter, setActiveSortAndFilter] = useState("filterBy");
    const [showRequestACallback, setShowRequestACallback] = useState(false);
    const [pageCode, setPageCode] = useState('');
    const [success, setSuccess] = useState('')
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [timer, setTimer] = useState<number>(30);
    const [mobileCallClick, setMobileCallClick] = useState<boolean>(false);
    const END_TIMER = 0;

    const [showLoadMoreLoader, setShowLoadMoreLoader] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [authModal, setAuthModal] = useState(false);
    const lastCardRef = useRef();
    const [getUserProfile] = useGetUserProfileMutation();

    const [createCoupon, { isLoading: loadingCreate }] = useCreateCouponMutation();
    const [couponModal, setCouponModal] = useState(false)
    const [couponData, setCouponData] = useState({ per: 0, cc: '' })
    const [couponCopied, setCouponCopied] = useState(false)
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const navigate = useNavigate();

    if (!Benefits || Benefits.length === 0) return null;

    const handleBannerClick = (banner: any) => {
        if (banner?.type === 'snpl') {
            navigate(banner?.link);
        } else {
            handleOpenReqCallback('upc_mid_banner');
        }
    };

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
                console.log('Error creating coupon: ', res);
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

    const idle = useIdleTimer();

    const handleStripeHeight = (height: number) => {
        setStripeHeight(height);
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        // trackPageViewed({
        //     pageName: 'Upcoming Cruises',
        //     pagePath: window.location.pathname,
        //     pageUrl: window.location.href
        // });
    }, []);

    const hasTrackedSearch = useRef(false);

    useEffect(() => {
        // Reset tracking flag when page is 1 (new search/filter applied)
        if (page === 1) {
            hasTrackedSearch.current = false;
        }
    }, [page]);

    useEffect(() => {
        if (!isLoading && itineraryData && page === 1 && !hasTrackedSearch.current) {
            trackCustomEvent(ANALYTICS_EVENTS.FIND_A_CRUISE, {
                destination_name: portSelector || "",
                search_result_count: itineraryData?.length || 0,
                page_url: window.location.href,
            });
            hasTrackedSearch.current = true;
        }
    }, [isLoading, itineraryData, page]);

    useEffect(() => {
        if (showOTPModal) {
            if (timer && timer !== END_TIMER) {
                var tempTimer = setInterval(
                    () => setTimer(timer - 1),
                    1000
                );
                return function cleanup() {
                    clearInterval(tempTimer);
                };
            }
        }
    }, [showOTPModal, timer]);

    useEffect(() => {
        if (AUTH?.token && AUTH.exp > Math.round(+new Date() / 1000)) { } else {
            if (!ab) {
                // const array = [1, 2];
                const array = [1];
                const randomNumber = array[Math.floor(Math.random() * array.length)];
                SaveAB(randomNumber)
            }
        }
    }, [])

    useEffect(() => {
        if (stt && !AUTH?.token) {
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
        setToken(GetAuth()?.token)
    }, [GetAuth()])

    useEffect(() => {
        if (shipsList && cruiseSelector) {
            var array = cruiseSelector.split(",");
            const matchedShips = shipsList?.filter((ship) => array.includes(ship.id));
            console.log(matchedShips, 'matchedShips', shipsList)
            setTempCruiseFilter(matchedShips)
            setCruiseFilter(matchedShips);
        }
    }, [shipsList])

    useEffect(() => {
        if (itinerarySelector && !filterApplied) {
            fetchData(`?itinerary_id=${itinerarySelector}`);
        }
        else {
            let _payload: string = `?pagination=true&page=${page}${params}`;
            let newParams: any = '';
            if (destinationPortsSelector) {
                const decodedPorts = decodeURIComponent(destinationPortsSelector);
                const portsArray = decodedPorts.match(/[^,]+(?:,\s[^,]+)?/g)?.map(p => p.trim()) || [];

                // Update filters
                setTempDestinationFilter([...portsArray]);
                setDestinationFilter([...portsArray]);
                _payload += `&ports=${encodeURIComponent(JSON.stringify(portsArray))}`;
                newParams += `&ports=${encodeURIComponent(JSON.stringify(portsArray))}`;

                // var array = destinationPortsSelector.split(",");
                // setTempDestinationFilter([...array])
                // setDestinationFilter([...array]);
                // _payload = _payload + `&ports=${JSON.stringify(array)}`;
                // newParams = newParams + `&ports=${JSON.stringify(array)}`;
            }
            if (startSelector) {
                var array = startSelector.split(",");
                setTempOriginFilter([...array])
                setOriginFilter([...array]);
                _payload = _payload + `&starting_ports=${JSON.stringify(array)}`;
                newParams = newParams + `&starting_ports=${JSON.stringify(array)}`;
            }
            if (portSelector) {
                var array = portSelector.split(",");
                setTempDestinationFilter([...array])
                setDestinationFilter([...array]);
                _payload = _payload + `&ports=${JSON.stringify(array)}`;
                newParams = newParams + `&ports=${JSON.stringify(array)}`;
            }
            if (datesParam) {
                var array = datesParam.split(",");
                setTempMonthFilter([...array])
                setMonthFilter([...array]);
                _payload = _payload + `&dates=${JSON.stringify(array)}`;
                newParams = newParams + `&dates=${JSON.stringify(array)}`;
            }
            if (nightSelector) {
                var array = nightSelector.split(",");
                setTempNoOfNightFilter([...array])
                setNoOfNightFilter([...array]);
                _payload = _payload + `&night_counts=${JSON.stringify(array)}`;
                newParams = newParams + `&night_counts=${JSON.stringify(array)}`;
            }
            if (cruiseSelector) {
                var array = cruiseSelector.split(",");
                _payload = _payload + `&ship_ids=${JSON.stringify(array)}`;
                newParams = newParams + `&ship_ids=${JSON.stringify(array)}`;
            }
            if (dateAfterParam) {
                const dateAfter = dateAfterParam;
                _payload = _payload + `&date_after=${dateAfter}`;
                newParams = newParams + `&date_after=${dateAfter}`;
            }
            if (dateBeforeParam) {
                const dateBefore = dateBeforeParam;
                _payload = _payload + `&date_before=${dateBefore}`;
                newParams = newParams + `&date_before=${dateBefore}`;
            }
            if (tripTypeParam) {
                const array = tripTypeParam.split(",");
                _payload = _payload + `&trip_type=${JSON.stringify(array)}`;
                newParams = newParams + `&trip_type=${JSON.stringify(array)}`;
            }
            if (sortOrder) {
                _payload += `&sort_type=${sortOrder}`;
            }

            if (newParams || page === 1) {
                setParams(newParams);
            }
            fetchData(_payload);
        }
    }, [destinationPortsSelector, startSelector, portSelector, nightSelector, cruiseSelector, dateAfterParam, dateBeforeParam, page, itinerarySelector, tripTypeParam])

    const toggleFilter = (type: any) => {
        setActiveFilter((prev: any) => (prev === type ? null : type));
    }

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setActiveFilter(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const fetchData = async (_payload: any, isManualSearch?: boolean) => {
        setIsLoading(true);
        try {
            const res: any = await getItinerary(_payload).unwrap();

            const urlParams = new URLSearchParams(_payload.startsWith('?') ? _payload : `?${_payload}`);
            const currentPage = parseInt(urlParams.get('page') || '1');

            if (currentPage === 1) {
                setItineraryData(res.itineraries || []);
            } else {
                setItineraryData((prev: any) => [...prev, ...(res.itineraries || [])]);
            }

            setHasMore(res?.pagination?.total_pages != res?.pagination?.current_page ? true : false);

            if (res.ports) setPortsList(res.ports);
            if (res.ships) setShipsList(res.ships);
            if (res.available_night_counts) setNightList(res.available_night_counts);
            if (res.available_dates) setAvailableDates(res.available_dates);
            if (res.ports) {
                let origin = res.ports.filter((port: any) => port.origin)
                setOrigin(origin)
            }

            if (isManualSearch) {
                trackCustomEvent(ANALYTICS_EVENTS.ITINERARY_SEARCHED, {
                    destination_name: tempDestinationFilter?.join(', ') || "",
                    travel_month_year: tempMonthFilter?.join(', ') || "",
                    no_of_nights: tempNoOfNightFilter?.join(', ') || "",
                    cruise_name: tempCruiseFilter?.map((item: any) => item.name).join(', ') || "",
                    search_result_count: res.itineraries?.length || 0,
                });
            }
        } catch (err) {
            console.log('Error: ', err);
        } finally {
            setIsLoading(false);
            setShowLoadMoreLoader(false)
        }
    };

    const applyFilter = () => {
        setActiveFilter('')
        setPage(1);
        let _payload: string = `?pagination=true&page=1`;
        let newParams: any = '';
        setFilterApplied(true)
        if (tempDestinationFilter && tempDestinationFilter.length) {
            _payload += `&ports=${JSON.stringify(tempDestinationFilter)}`;
            newParams += `&ports=${JSON.stringify(tempDestinationFilter)}`;
            setDestinationFilter(tempDestinationFilter)
        } else {
            setDestinationFilter([])
        }

        if (tempMonthFilter && tempMonthFilter.length) {
            _payload += `&dates=${JSON.stringify(tempMonthFilter)}`;
            newParams += `&dates=${JSON.stringify(tempMonthFilter)}`;
            setMonthFilter(tempMonthFilter)
        } else {
            setMonthFilter([])
        }

        if (tempNoOfNightFilter && tempNoOfNightFilter.length) {
            _payload += `&night_counts=${JSON.stringify(tempNoOfNightFilter)}`;
            newParams += `&night_counts=${JSON.stringify(tempNoOfNightFilter)}`;
            setNoOfNightFilter(tempNoOfNightFilter)
        } else {
            setNoOfNightFilter([])
        }

        if (tempCruiseFilter && tempCruiseFilter.length) {
            const cruiseIds = tempCruiseFilter.map((item: any) => item.id);
            _payload += `&ship_ids=${JSON.stringify(cruiseIds)}`;
            newParams += `&ship_ids=${JSON.stringify(cruiseIds)}`;
            setCruiseFilter(tempCruiseFilter)
        } else {
            setCruiseFilter([])
        }

        if (tempOriginFilter && tempOriginFilter.length) {
            _payload += `&starting_ports=${JSON.stringify(tempOriginFilter)}`;
            newParams += `&starting_ports=${JSON.stringify(tempOriginFilter)}`;
            setOriginFilter(tempOriginFilter)
        } else {
            setOriginFilter([])
        }

        if (tempTripTypeFilter && tempTripTypeFilter.length) {
            _payload += `&trip_type=${JSON.stringify(tempTripTypeFilter)}`;
            newParams += `&trip_type=${JSON.stringify(tempTripTypeFilter)}`;
            setTripTypeFilter(tempTripTypeFilter)
        } else {
            setTripTypeFilter([])
        }

        if (sortOrder) {
            _payload += `&sort_type=${sortOrder}`;
        }

        setParams(newParams)
        fetchData(_payload, true)
    }

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
        // setShowLoadMore(false);
        setShowLoadMoreLoader(true);
    };

    const setTempFilterData = async (name: any, value: any) => {
        if (name == 'destination') {
            let arr: any = JSON.parse(JSON.stringify(tempDestinationFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempDestinationFilter([...arr])
        }
        if (name == 'month') {
            let arr: any = JSON.parse(JSON.stringify(tempMonthFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempMonthFilter([...arr])
        }
        if (name == 'nights') {
            let arr: any = JSON.parse(JSON.stringify(tempNoOfNightFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempNoOfNightFilter([...arr])
        }
        if (name == 'cruise') {
            setTempCruiseFilter((prev) => {
                const isSelected = prev.some((c) => c.id === value.id);
                if (isSelected) {
                    return prev.filter((c) => c.id !== value.id); // remove
                } else {
                    return [...prev, { id: value.id, name: value.name }]; // add
                }
            });
        }
        if (name == 'origin') {
            let arr: any = JSON.parse(JSON.stringify(tempOriginFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempOriginFilter([...arr])
        }
        if (name == 'trip') {
            let arr: any = JSON.parse(JSON.stringify(tempTripTypeFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempTripTypeFilter([...arr])
        }
    }

    const DestinationDropdown = () => {
        return (
            <div className="absolute top-20 left-0 z-[21] bg-white p-4 rounded-xl shadow-lg w-[600px]">
                <p className="font-semibold mb-2">Which destination would you like to cruise to?</p>

                <div className="mb-2">
                    {/* <p className="font-medium">Domestic</p> */}
                    <div className="flex flex-wrap gap-2 mt-1">
                        {portsList && [...portsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                            return (
                                <span
                                    onClick={() => setTempFilterData('destination', val.name)}
                                    className={`text-xs font-medium px-4 py-2 rounded border-gray-100/5 cursor-pointer text-center ${tempDestinationFilter.includes(val.name) ? "bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white" : "bg-gray-100/10 hover:bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-black hover:text-white"}`}
                                >
                                    {val.name}
                                </span>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-4 gap-4">
                    {/* <button onClick={() => setTempDestinationFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                    <button onClick={() => setActiveFilter(null)} className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold">Done</button> */}
                    <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempDestinationFilter([])} className='w-1/2' />
                    <Button text='DONE' size='sm' handleClick={() => setActiveFilter(null)} className='w-full' />
                </div>
            </div>
        );
    };
    const NightDropdown = () => {
        return (
            <div className="absolute top-20 left-0 z-[21] bg-white p-4 rounded-xl shadow-lg w-[400px]">
                <p className="font-semibold mb-2">How many nights would you like to cruise with us?</p>

                <div className="mb-2">
                    <div className="flex flex-wrap gap-3 mt-1">
                        {nightList.map((val: any, i: number) => {
                            return (
                                <span
                                    onClick={() => setTempFilterData('nights', val)}
                                    className={`text-xs font-medium px-4 py-2 rounded border-gray-100/5 cursor-pointer text-center ${tempNoOfNightFilter.includes(val) ? "bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white" : "bg-gray-100/10 hover:bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-black hover:text-white"}`}
                                >
                                    {val} Nights
                                </span>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-4 gap-4">
                    {/* <button onClick={() => setTempNoOfNightFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                    <button onClick={() => setActiveFilter(null)} className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold">Done</button> */}
                    <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempNoOfNightFilter([])} className='w-1/2' />
                    <Button text='DONE' size='sm' handleClick={() => setActiveFilter(null)} className='w-full' />
                </div>
            </div>
        );
    };
    const CruiseDropdown = () => {
        return (
            <div className="absolute top-20 left-0 z-[21] bg-white p-4 rounded-xl shadow-lg w-[400px]">
                <p className="font-semibold mb-2">Ready to sail? Choose your cruise</p>

                <div className="mb-2">
                    <div className="flex flex-wrap gap-3 mt-1">
                        {shipsList.map((val: any, i: number) => {
                            return (
                                <span
                                    onClick={() => setTempFilterData('cruise', val)}
                                    className={`text-xs font-medium px-4 py-2 rounded border-gray-100/5 cursor-pointer text-center ${tempCruiseFilter.some((c: any) => c.name === val.name) ? "bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white" : "bg-gray-100/10 hover:bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-black hover:text-white"}`}
                                >
                                    {val.name}
                                </span>
                            )
                        })}
                    </div>
                </div>
                <div className="flex justify-between mt-4 gap-4">
                    {/* <button onClick={() => setTempCruiseFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                    <button onClick={() => setActiveFilter(null)} className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold">Done</button> */}
                    <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempCruiseFilter([])} className='w-1/2' />
                    <Button text='DONE' size='sm' handleClick={() => setActiveFilter(null)} className='w-full' />
                </div>
            </div>
        );
    };

    const removeFilterOption = (name: string, value: any) => {
        if (name === 'removeAll') {
            setTempDestinationFilter([]);
            setTempMonthFilter([]);
            setTempNoOfNightFilter([]);
            setTempCruiseFilter([]);
            setDestinationFilter([]);
            setMonthFilter([]);
            setNoOfNightFilter([]);
            setCruiseFilter([]);
            setItineraryData([]);

            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, baseUrl);
            setParams('');

            let _payload: string = `?pagination=true&page=1`;
            fetchData(_payload);
        } else {
            let newParams: any = '';
            let _payload: string = `?pagination=true&page=1`;
            if (name === 'destination') {
                const updatedFilter = destinationFilter.filter((item: any) => item !== value);
                setTempDestinationFilter(updatedFilter);
                setDestinationFilter(updatedFilter);
                if (updatedFilter && updatedFilter.length) {
                    _payload = _payload + params.replace(/ports=\[[^\]]*\]/, `ports=${JSON.stringify(updatedFilter)}`);
                    newParams = params.replace(/ports=\[[^\]]*\]/, `ports=${JSON.stringify(updatedFilter)}`);
                } else {
                    _payload = _payload + params.replace(/&?ports=\[[^\]]*\]/, '');
                    newParams = params.replace(/&?ports=\[[^\]]*\]/, '');
                }
            }
            if (name === 'month') {
                const updatedFilter = monthFilter.filter((item: any) => item !== value);
                setTempMonthFilter(updatedFilter);
                setMonthFilter(updatedFilter);
                if (updatedFilter && updatedFilter.length) {
                    _payload = _payload + params.replace(/dates=\[[^\]]*\]/, `dates=${JSON.stringify(updatedFilter)}`);
                    newParams = params.replace(/dates=\[[^\]]*\]/, `dates=${JSON.stringify(updatedFilter)}`);
                } else {
                    _payload = _payload + params.replace(/&?dates=\[[^\]]*\]/, '');
                    newParams = params.replace(/&?dates=\[[^\]]*\]/, '');
                }
            }
            if (name === 'nights') {
                const updatedFilter = noOfNightFilter.filter((item: any) => item !== value);
                setTempNoOfNightFilter(updatedFilter);
                setNoOfNightFilter(updatedFilter);
                if (updatedFilter && updatedFilter.length) {
                    _payload = _payload + params.replace(/night_counts=\[[^\]]*\]/, `night_counts=${JSON.stringify(updatedFilter)}`);
                    newParams = params.replace(/night_counts=\[[^\]]*\]/, `night_counts=${JSON.stringify(updatedFilter)}`);
                } else {
                    _payload = _payload + params.replace(/&?night_counts=\[[^\]]*\]/, '');
                    newParams = params.replace(/&?night_counts=\[[^\]]*\]/, '');
                }
            }
            if (name === 'cruise') {
                const updatedFilter = cruiseFilter.filter((item: any) => item.id !== value.id);
                setTempCruiseFilter(updatedFilter);
                setCruiseFilter(updatedFilter);
                if (updatedFilter && updatedFilter.length) {
                    const cruiseIds = updatedFilter.map((item: any) => item.id);
                    _payload = _payload + params.replace(/ship_ids=\[[^\]]*\]/, `ship_ids=${JSON.stringify(cruiseIds)}`);
                    newParams = params.replace(/ship_ids=\[[^\]]*\]/, `ship_ids=${JSON.stringify(cruiseIds)}`);
                } else {
                    _payload = _payload + params.replace(/&?ship_ids=\[[^\]]*\]/, '');
                    newParams = params.replace(/&?ship_ids=\[[^\]]*\]/, '');
                }
            }
            if (cruiseSelector && name === 'cruise') {
                // Remove only cruise ('cruise') from URL and reload
                const url = new URL(window.location.href);
                url.searchParams.delete('cruise');
                window.history.replaceState({}, document.title, url.toString());
                window.location.reload();
            } else {
                // Normal behavior for all other filters
                if (sortOrder) {
                    _payload += `&sort_type=${sortOrder}`;
                }
                setParams(newParams);
                fetchData(_payload, true);
            }
        }
    }

    const sortByFunction = (option: string) => {
        setPage(1);
        setSortOrder(option);
        let _payload: string = `?pagination=true&page=1${params}`;
        let param = `&sort_type=${option}`;
        setSortByFilter(param);
        fetchData(_payload + param);
        setSortByPopover(false);
        setIsOpenNewSortAndFilter(false);
    }

    const destinationScroll = useHorizontalScroll();

    const NewSortAndFilterBottomSheet = () => {
        return (
            <>
                {isOpenNewSortAndFilter &&
                    <>
                        <div
                            className={`fixed inset-0 bg-black bg-opacity-70 transition-opacity duration-300 z-30 ${isOpenNewSortAndFilter ? "!bg-opacity-70 visible" : "bg-opacity-0 invisible"
                                }`}
                            onClick={() => setIsOpenNewSortAndFilter(false)}
                        />

                        {/* Bottom Sheet */}
                        <div>
                            <div
                                className={`fixed left-0 w-full -bottom-[45%] bg-white p-4 rounded-t-2xl shadow-lg transition-all duration-300 ease-in z-30 `}
                                style={{
                                    bottom: isOpenNewSortAndFilter ? "0" : "",
                                }}
                            >
                                {/* Sheet Header */}
                                <div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsOpenNewSortAndFilter(false)}
                                            className="float-right text-gray-500 hover:text-gray-600"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-6 h-6 text-black cursor-pointer"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fill-rule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clip-rule="evenodd"
                                                ></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className='flex text-center border-b'>
                                        <div
                                            className={`basis-1/2 pb-4 font-bold text-lg ${activeSortAndFilter === 'filterBy' ? 'border-b-2 border-brand-primary' : 'text-gray-100 border-gray-400'}`}
                                            onClick={() => {
                                                setActiveSortAndFilter("filterBy");
                                                trackCustomEvent(ANALYTICS_EVENTS.FILTER_BY, {
                                                    trip_type: tempTripTypeFilter.join(", ") || "",
                                                    departure_port: tempOriginFilter.join(", ") || "",
                                                    filter_apply: "Apply",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length,
                                                    page_url: window.location.href,
                                                });
                                            }}
                                        >
                                            Filter By
                                        </div>
                                        <div
                                            className={`basis-1/2 pb-4 font-bold text-lg ${activeSortAndFilter === 'sortBy' ? 'border-b-2 border-brand-primary' : 'text-gray-100 border-gray-400'}`}
                                            onClick={() => {
                                                setActiveSortAndFilter("sortBy");
                                                trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                    sort_by_price_low_to_high: "Sort by Price Low to High",
                                                    sort_by_price_high_to_low: "Sort by Price High to Low",
                                                    sort_by_earliest_date: "Sort by Earliest Date",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length,
                                                    page_url: window.location.href,
                                                });
                                            }}
                                        >
                                            Sort By
                                        </div>
                                    </div>
                                </div>
                                {activeSortAndFilter === "filterBy" &&
                                    <div>
                                        {/* Sheet Content */}
                                        <div className='py-4 max-h-96 overflow-y-auto'>
                                            <div>
                                                <p className='font-semibold'>Trip Type</p>
                                                <div className='flex mt-2 gap-2'>
                                                    <div onClick={() => setTempFilterData('trip', 'one_way')} className={`flex items-center text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempTripTypeFilter.includes('one_way') ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}>
                                                        <img className='mr-2' src={`${tempTripTypeFilter.includes('one_way') ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway_white.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-black-icon.svg'}`} alt="" />
                                                        <p className='text-xs lg:text-sm font-normal'>One Way</p>
                                                    </div>
                                                    <div onClick={() => setTempFilterData('trip', 'round')} className={`flex items-center text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempTripTypeFilter.includes('round') ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}>
                                                        <img className='mr-2' src={`${tempTripTypeFilter.includes('round') ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip_white.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-black-icon.svg'}`} alt="" />
                                                        <p className='text-xs lg:text-sm font-normal'>Round Trip</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='mt-5'>
                                                <p className='font-semibold'>Departure Port</p>
                                                <div className='flex flex-wrap gap-2 mt-2'>
                                                    {origin && origin.map((val: any, i: number) => {
                                                        return (
                                                            <div onClick={() => setTempFilterData('origin', val.name)} key={i} className={`flex items-center text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempOriginFilter.includes(val.name) ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}>
                                                                <p className='text-xs lg:text-sm font-normal'>{val.name}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex gap-3'>
                                            <Button text='Reset All' size='sm' type='secondary' handleClick={() => {
                                                setTempTripTypeFilter([]);
                                                setTempOriginFilter([]);
                                            }} className='w-full' />
                                            <Button text='Apply' size='sm' handleClick={() => {
                                                applyFilter()
                                                setIsOpenNewSortAndFilter(false);
                                                trackCustomEvent(ANALYTICS_EVENTS.FILTER_BY, {
                                                    trip_type: tempTripTypeFilter.join(", ") || "",
                                                    departure_port: tempOriginFilter.join(", ") || "",
                                                    filter_apply: "Apply",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length || 0,
                                                    page_url: window.location.href,
                                                });
                                            }} className='w-full' />
                                        </div>
                                    </div>
                                }
                                {activeSortAndFilter === "sortBy" &&
                                    <div className='pt-6'>
                                        <div
                                            className='py-3 text-sm border-b border-gray-400'
                                            onClick={() => {
                                                sortByFunction("price_low_to_high");
                                                trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                    sort_by_price_low_to_high: "Sort by Price Low to High",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length,
                                                    page_url: window.location.href,
                                                });
                                            }}
                                        >
                                            <p>Price Low To High</p>
                                        </div>
                                        <div
                                            className='py-3 text-sm border-b border-gray-400'
                                            onClick={() => {
                                                sortByFunction("price_high_to_low");
                                                trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                    sort_by_price_high_to_low: "Sort by Price High to Low",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length,
                                                    page_url: window.location.href,
                                                });
                                            }}
                                        >
                                            <p>Price High To Low</p>
                                        </div>
                                        <div
                                            className='py-3 text-sm'
                                            onClick={() => {
                                                sortByFunction("earliest_date");
                                                trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                    sort_by_earliest_date: "Sort by Earliest Date",
                                                    destination_name: portSelector || "",
                                                    cruise_search_results: itineraryData?.length,
                                                    page_url: window.location.href,
                                                });
                                            }}
                                        >
                                            <p>Earliest Date</p>
                                        </div>
                                        {/* <div className='py-3 text-sm'>
                                    <p>Recommended</p>
                                </div> */}
                                    </div>
                                }
                            </div>
                        </div>
                    </>
                }
            </>
        );
    };

    useEffect(() => {
        const stopPropagationForSelect = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Check if the click is inside a react-select dropdown
            if (target.closest('.react-select__menu')) {
                e.stopPropagation();
            }
        };

        // Add listener in capture phase so it runs before modal's listener
        document.addEventListener('click', stopPropagationForSelect, true);

        return () => {
            document.removeEventListener('click', stopPropagationForSelect, true);
        };
    }, []);

    const handleOpenReqCallback = (type: string) => {
        setShowRequestACallback(true);
        setPageCode(type);
    }

    // Chatbot integration
    const chatbotPortNames = portsList?.map((p: any) => p.name) || [];
    const chatbotOriginNames = origin?.map((p: any) => p.name) || [];
    const chatbotNights = nightList?.map((n: any) => Number(n)) || [];

    const chatbotItineraries = useMemo(() => {
        return (itineraryData || []).slice(0, 5).map((it: any) => ({
            id: it.itinerary_id,
            ship_name: it.ship?.name || '',
            destination: it.destination_port?.name || it.ports?.find((p: any) => !p.origin)?.name || '',
            origin: it.ports?.find((p: any) => p.origin)?.name || '',
            nights: it.nights,
            start_date: it.start_date,
            starting_fare: it.starting_fare,
            trip_type: it.trip_type,
            offers_available: (it.offers_available || []).map((o: any) => typeof o === 'string' ? o : o?.offer).filter(Boolean),
            tags: it.tags || [],
            discount_pct: it.discount_pct || 0,
            ports: (it.ports || []).filter((p: any) => p.name && p.name !== 'At Sea').map((p: any) => ({
                name: p.name,
                day: p.day || '',
                type: p.type || '',
                arrival: p.arrival || '',
                departure: p.departure || '',
                embarkation_start_time: p.embarkation_start_time || '',
                embarkation_end_time: p.embarkation_end_time || '',
            })),
        }));
    }, [itineraryData]);

    const { applyFromChatbot, resetFromChatbot } = useChatbotFilters({
        setTempDestinationFilter, setTempMonthFilter, setTempNoOfNightFilter,
        setTempOriginFilter, setTempTripTypeFilter, setTempCruiseFilter,
        setDestinationFilter, setMonthFilter, setNoOfNightFilter,
        setOriginFilter, setTripTypeFilter, setCruiseFilter,
        setFilterApplied, setPage, setParams, setActiveFilter,
        fetchData, sortOrder,
    });

    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowStripeHeader(false);
        }, 30000);

        return () => clearTimeout(timerId);
    }, []);

    // const sortedItineraries = useMemo(() => {
    //     const data = [...(itineraryData || [])];

    //     if (sortOrder === 'price_low_to_high') {
    //         return data.sort((a, b) => a.starting_fare - b.starting_fare);
    //     }

    //     if (sortOrder === 'price_high_to_low') {
    //         return data.sort((a, b) => b.starting_fare - a.starting_fare);
    //     }

    //     return data; // default (no sort)
    // }, [itineraryData, sortOrder]);

    // Utility to chunk array into groups of 3
    const chunkedItineraries = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < itineraryData?.length; i += 3) {
            chunks.push(itineraryData?.slice(i, i + 3));
        }
        return chunks;
    }, [itineraryData]);

    const isAfter7Days = (startDate: string) => {
        if (!startDate) return false;

        const [day, month, year] = startDate.split('/').map(Number);

        const start = new Date(year, month - 1, day).getTime();
        const now = new Date().getTime();

        return start - now > 7 * 24 * 60 * 60 * 1000;
    };

    return (
        <Layout showTopHeader={false} showStripeHeader={showStripeHeader} setShowStripeHeader={setShowStripeHeader} onStripeHeightChange={handleStripeHeight}>
            {isLoading && !showLoadMoreLoader ?
                <div className='h-full w-full flex justify-center items-center overflow-hidden fixed bg-black/90 z-50'>
                    <img
                        className='w-32 lg:w-44'
                        src="/assets/images/cordelia-new-loader.gif"
                        alt=""
                    />
                </div>
                : null
            }
            <div style={{ marginTop: window.innerWidth < 600 && showStripeHeader && stripeHeight ? `${stripeHeight + 28}px` : window.innerWidth > 600 && showStripeHeader && stripeHeight ? `${stripeHeight + 32}px` : window.innerWidth < 600 ? "12px" : "8px" }} className='pt-[52px] pb-24 lg:pt-[62px] lg:pb-28 mt-3'>
                {/* <Banner data={banner} /> */}
                <div className='relative'>
                    <div className="">
                        <div className='container mx-auto'>
                            <div className="mx-auto px-4 lg:px-32 text-center pt-4 lg:pt-6 pb-4">
                                <h1 className='font-semibold text-2xl lg:text-[1.75rem]'>Explore Cruise Holidays</h1>
                            </div>
                            {/* Filter Web*/}
                            <div ref={filterRef} className="hidden lg:flex justify-between items-center px-4 py-3 w-[90%] rounded-xl shadow-allSide bg-white max-w-6xl mx-auto border border-gray-300">
                                <div id="upc_destinations_ports" className="w-[20%] relative">
                                    <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleFilter('destination')}>
                                        <div>
                                            <label className="text-xs cursor-pointer">Select Destination</label>
                                            <p className={`font-semibold ${tempDestinationFilter && tempDestinationFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                                {tempDestinationFilter && tempDestinationFilter.length ? tempDestinationFilter.length > 2 ? `${tempDestinationFilter[0]}, ${tempDestinationFilter[1]}...+${tempDestinationFilter.length - 2}` : tempDestinationFilter.join(', ') : 'Where to?'}
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {activeFilter === 'destination' && <DestinationDropdown />}
                                </div>

                                <div className='border-l h-[40px] mx-4'></div>

                                <div id="upc_months" className="w-[20%] relative">
                                    <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleFilter('month')}>
                                        <div>
                                            <label className="text-xs cursor-pointer">Select Month</label>
                                            {/* <p className="font-semibold text-gray-100">
                                                Travel month?
                                            </p> */}
                                            <p className={`font-semibold ${tempMonthFilter && tempMonthFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                                {tempMonthFilter && tempMonthFilter.length ? tempMonthFilter.length > 2 ? `${tempMonthFilter[0]}, ${tempMonthFilter[1]}...+${tempMonthFilter.length - 2}` : tempMonthFilter.join(', ') : 'Travel month?'}
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {activeFilter === 'month' && <MonthDropdown availableDates={availableDates} tempMonthFilter={tempMonthFilter} setTempMonthFilter={setTempMonthFilter} setActiveFilter={setActiveFilter} />}
                                </div>

                                <div className='border-l h-[40px] mx-4'></div>

                                <div id="upc_nights" className="w-[20%] relative">
                                    <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleFilter('night')}>
                                        <div>
                                            <label className="text-xs cursor-pointer">Select Night</label>
                                            <p className={`font-semibold ${tempNoOfNightFilter && tempNoOfNightFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                                {tempNoOfNightFilter && tempNoOfNightFilter.length ? tempNoOfNightFilter.length > 2 ? `${tempNoOfNightFilter[0]}N, ${tempNoOfNightFilter[1]}N...+${tempNoOfNightFilter.length - 2}` : tempNoOfNightFilter.map((item: number) => `${item}N`).join(', ') : 'Nights?'}
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {activeFilter === 'night' && <NightDropdown />}
                                </div>

                                <div className='border-l h-[40px] mx-4'></div>

                                <div id="upc_cruise" className="w-[20%] relative">
                                    <div className='flex justify-between items-center cursor-pointer' onClick={() => toggleFilter('cruise')}>
                                        <div>
                                            <label className="text-xs cursor-pointer">Select Cruise</label>
                                            <p className={`font-semibold ${tempCruiseFilter && tempCruiseFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                                {tempCruiseFilter && tempCruiseFilter.length
                                                    ? tempCruiseFilter.length > 2
                                                        ? `${tempCruiseFilter[0].name}, ${tempCruiseFilter[1].name}...+${tempCruiseFilter.length - 2}`
                                                        : tempCruiseFilter.map(item => item.name).join(', ')
                                                    : 'Cruise name?'}
                                            </p>
                                        </div>
                                    </div>
                                    {activeFilter === 'cruise' && <CruiseDropdown />}
                                </div>
                                <Button text='Apply' size='medium' handleClick={applyFilter} className='!px-16 rounded-full !py-4' />
                            </div>
                            {/* Filter Mobile*/}
                            <div className='px-4'>
                                <div
                                    className="flex justify-between items-center lg:hidden bg-white rounded-full p-4 border border-gray-300/10 shadow-allSide cursor-pointer"
                                    onClick={() => setMainMobileFilterModal(true)}
                                >
                                    <p className='text-sm text-gray-700'>Destination, Month, Night, Cruise</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {(destinationFilter.length ||
                            monthFilter.length ||
                            noOfNightFilter.length ||
                            noOfNightFilter.length ||
                            cruiseFilter?.length) > 0 && (
                                <div className='flex gap-1 basis-2/3 w-full lg:w-[70%] pt-3 container mx-auto'>
                                    <div ref={destinationScroll.scrollRef} className='filterScroll overflow-auto px-4 lg:px-0'>
                                        <div className='mr-8 flex gap-3 w-max mt-0.5'>
                                            <button
                                                onClick={() => {
                                                    removeFilterOption('removeAll', null);
                                                }}
                                                className="flex items-center gap-2 px-4 py-1 text-white bg-brand-gradient rounded-full font-semibold"
                                            >
                                                Clear All ✕
                                            </button>

                                            {destinationFilter.map((item: string) => (
                                                <div
                                                    key={item}
                                                    className="flex items-center gap-2 text-brand-primary rounded-full px-3 py-1 text-sm font-medium"
                                                    style={{
                                                        border: '2px solid transparent',
                                                        backgroundImage:
                                                            'linear-gradient(#fff, #fff), linear-gradient(99.72deg, #92278f -17.25%, #ea725b 105.93%)',
                                                        backgroundClip: 'padding-box, border-box',
                                                        backgroundOrigin: 'border-box'
                                                    }}
                                                >
                                                    {item}
                                                    <button onClick={() => removeFilterOption('destination', item)}>✕</button>
                                                </div>
                                            ))}

                                            {monthFilter.map((item: string) => (
                                                <div
                                                    key={item}
                                                    className="flex items-center gap-2 text-brand-primary rounded-full px-3 py-1 text-sm font-medium"
                                                    style={{
                                                        border: '2px solid transparent',
                                                        backgroundImage:
                                                            'linear-gradient(#fff, #fff), linear-gradient(99.72deg, #92278f -17.25%, #ea725b 105.93%)',
                                                        backgroundClip: 'padding-box, border-box',
                                                        backgroundOrigin: 'border-box'
                                                    }}
                                                >
                                                    {item}
                                                    <button onClick={() => removeFilterOption('month', item)}>✕</button>
                                                </div>
                                            ))}

                                            {noOfNightFilter.map((item: number) => (
                                                <div
                                                    key={item}
                                                    className="flex items-center gap-2 text-brand-primary rounded-full px-3 py-1 text-sm font-medium"
                                                    style={{
                                                        border: '2px solid transparent',
                                                        backgroundImage:
                                                            'linear-gradient(#fff, #fff), linear-gradient(99.72deg, #92278f -17.25%, #ea725b 105.93%)',
                                                        backgroundClip: 'padding-box, border-box',
                                                        backgroundOrigin: 'border-box'
                                                    }}
                                                >
                                                    {item} Nights
                                                    <button onClick={() => removeFilterOption('nights', item)}>✕</button>
                                                </div>
                                            ))}

                                            {cruiseFilter?.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-2 text-brand-primary rounded-full px-3 py-1 text-sm font-medium"
                                                    style={{
                                                        border: '2px solid transparent',
                                                        backgroundImage:
                                                            'linear-gradient(#fff, #fff), linear-gradient(99.72deg, #92278f -17.25%, #ea725b 105.93%)',
                                                        backgroundClip: 'padding-box, border-box',
                                                        backgroundOrigin: 'border-box'
                                                    }}
                                                >
                                                    {item.name}
                                                    <button onClick={() => removeFilterOption('cruise', item)}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        <div className='grid grid-cols-8 mx-0 lg:mx-16 gap-6 mt-4 lg:mt-10'>
                            <div className='col-span-2 hidden lg:block'>
                                <div className='sticky top-[80px]'>
                                    <div className='bg-white pr-2 max-h-[calc(130vh-220px)] overflow-y-auto'>
                                        <div className="w-full rounded-md shadow-sm border border-primary overflow-hidden bg-white"
                                            style={{
                                                background:
                                                    'linear-gradient(180deg, rgba(255, 224, 254, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
                                            }}>
                                            <div className="px-3 pt-3 pb-4">
                                                <h2 className="text-lg font-bold">
                                                    Direct Booking{" "}
                                                    <span
                                                        className="font-playfairDisplay font-extrabold italic bg-brand-gradient bg-clip-text"
                                                        style={{ color: "transparent" }}
                                                    >
                                                        Benefits
                                                    </span>
                                                </h2>
                                                <p className="text-xs mt-0.5">Why book directly with us</p>
                                            </div>
                                            <div className="divide-y divide-primary border-t border-primary">
                                                {Benefits.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setActiveModal(item.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-4 text-left"
                                                    >
                                                        {/* Icon */}
                                                        <div className="flex-shrink-0 w-8 h-8 2xl:w-11 2xl:h-11 rounded-xl bg-gray-50 flex items-center justify-center">
                                                            <img
                                                                src={item.img}
                                                                alt={item.title}
                                                                className="w-10 h-auto object-contain"
                                                            />
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs 2xl:text-sm font-semibold  font-inter">
                                                                    {item.title}
                                                                </span>
                                                                {/* Info icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.625" stroke="currentColor" stroke-width="0.75"></circle><path d="M6 3.85736L6 6.71343" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"></path><path d="M6 8.12665L6 8.14265" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"></path></svg>
                                                            </div>
                                                            <p className="text-xxs 2xl:text-xs text-gray-900 leading-snug line-clamp-2">
                                                                {item.desc}
                                                            </p>
                                                        </div>

                                                        {/* Chevron */}
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-4 h-4 text-black flex-shrink-0"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className='mb-1 text-lg font-bold font-inter'>
                                            <CallbackSide callback={() => handleOpenReqCallback('upc_rac')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* <div className='lg:hidden w-[50px] h-[50px] rounded-full flex items-center justify-center mx-auto fixed bottom-20 right-8 z-10'>
                                <div className="circles">
                                    <div className="circle1"></div>
                                    <div className="circle2"></div>
                                    <div className="circle3"></div>
                                </div>
                                <div onClick={() => setMobileCallClick(true)} className='bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] w-full h-full flex items-center justify-center rounded-full z-[1]'>
                                    <img className='h-8 z-50' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/call-new-icon.svg" alt="" />
                                </div>
                            </div> */}

                            <div className='col-span-8 lg:col-span-6'>
                                <div className="">
                                    <div className='flex justify-between container px-4 lg:px-0'>
                                        <div>
                                            <p className='text-sm lg:text-lg font-semibold text-gray-600'>Cruise Search Results<span className='font-bold'>({itineraryData?.length})</span></p>
                                        </div>
                                        {/* Sort & Filter */}
                                        <div className='flex gap-6'>
                                            <div className='hidden lg:flex items-center relative'>
                                                <div onClick={() => {
                                                    setSortByPopover(prev => !prev)
                                                }} className='flex items-center cursor-pointer'>
                                                    <p className='text-base lg:text-sm font-bold text-gray-600'>Sort By</p>
                                                    <img className='h-2.5 lg:h-3 ml-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/filter-icon.svg" alt="sort_icon" />
                                                </div>
                                                <div
                                                    className={`fixed inset-0 z-10 ${sortByPopover ? "!bg-opacity-70 visible" : "bg-opacity-0 invisible"
                                                        }`}
                                                    onClick={() => setSortByPopover(false)}
                                                />
                                                {sortByPopover && <div className='absolute top-10 bg-white z-10 w-max shadow-allSide rounded-md'>
                                                    <div
                                                        className={`p-3 text-sm border-b border-gray-400 cursor-pointer ${sortOrder === 'price_low_to_high' ? 'bg-gray-400' : ''}`}
                                                        onClick={() => {
                                                            sortByFunction("price_low_to_high");
                                                            trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                                sort_by_price_low_to_high: "Sort by Price Low to High",
                                                                destination_name: portSelector || "",
                                                                cruise_search_results: itineraryData?.length,
                                                                page_url: window.location.href,
                                                            });
                                                        }}
                                                    >
                                                        <p>Price Low To High</p>
                                                    </div>
                                                    <div
                                                        className={`p-3 text-sm border-b border-gray-400 cursor-pointer ${sortOrder === 'price_high_to_low' ? 'bg-gray-400' : ''}`}
                                                        onClick={() => {
                                                            sortByFunction("price_high_to_low");
                                                            trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                                sort_by_price_high_to_low: "Sort by Price High to Low",
                                                                destination_name: portSelector || "",
                                                                cruise_search_results: itineraryData?.length,
                                                                page_url: window.location.href,
                                                            });
                                                        }}
                                                    >
                                                        <p>Price High To Low</p>
                                                    </div>
                                                    <div
                                                        className={`p-3 text-sm cursor-pointer ${sortOrder === 'earliest_date' ? 'bg-gray-400' : ''}`}
                                                        onClick={() => {
                                                            sortByFunction("earliest_date");
                                                            trackCustomEvent(ANALYTICS_EVENTS.SORT_BY, {
                                                                sort_by_earliest_date: "Sort by Earliest Date",
                                                                destination_name: portSelector || "",
                                                                cruise_search_results: itineraryData?.length,
                                                                page_url: window.location.href,
                                                            });
                                                        }}
                                                    >
                                                        <p>Earliest Date</p>
                                                    </div>
                                                </div>}
                                            </div>
                                            <div onClick={() => {
                                                window.innerWidth > 640 ? setMainFilter(true) : setIsOpenNewSortAndFilter(true);
                                            }} className='flex items-center cursor-pointer'>
                                                <p className='lg:hidden text-base lg:text-sm font-bold text-gray-600'>Filter</p>
                                                <p className='hidden lg:block text-base lg:text-sm font-bold text-gray-600'>Filter By</p>
                                                <img className='h-5 lg:h-5 ml-2' src="http://images.cordeliacruises.com/cordelia_v2/public/assets/filter-new-design-icon.svg" alt="filter_icon" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:hidden mt-4 container w-full max-w-7xl lg:pb-16 mx-auto ">
                                        {/* ── MOBILE: React Slick infinite scroll ── */}
                                        <div
                                            className="md:hidden rounded-xl bg-no-repeat bg-top bg-[length:100%_auto] overflow-hidden"
                                            style={{
                                                backgroundImage:
                                                    "url('https://images.cordeliacruises.com/cordelia_v2/public/assets/wave-bg-mobile.svg')",
                                                backgroundSize: "cover",
                                            }}
                                        >
                                            {/* Heading */}
                                            <div className="px-5 pt-4 pb-2">
                                                <h2 className="text-xl font-bold mt-1">
                                                    Direct Booking{" "}
                                                    <span
                                                        className="font-playfairDisplay font-extrabold bg-brand-gradient bg-clip-text pr-1"
                                                        style={{ color: "transparent" }}
                                                    >
                                                        Benefits
                                                    </span>
                                                </h2>
                                            </div>


                                            <div className="pt-1 pb-5 px-2 newbenefits-slider">
                                                <Slider {...slickSettings}>
                                                    {Benefits.map((item) => (
                                                        <div key={item.id} className="px-2">
                                                            <div
                                                                onClick={() => setActiveModal(item.id)}
                                                                role="button"
                                                                tabIndex={0}
                                                                className="cursor-pointer h-[130px] w-full px-2 bg-white rounded-xl justify-around flex flex-col pt-2 pb-2 hover:bg-gray-50 transition"
                                                            >
                                                                <div className="w-9 h-9 pb-2 pt-2 flex items-center justify-center rounded-full bg-gray-50">
                                                                    <img src={item.img} alt={item.title} className="w-[34px] h-[34px] object-contain " />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-black font-inter text-xs leading-tight ">
                                                                        {item.title}
                                                                    </h3>
                                                                    <p className="text-xxs text-gray-500 mt-0.5 leading-snug">
                                                                        {GetShortDesc(item.desc)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </Slider>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mt-4'>
                                        {chunkedItineraries.map((group, groupIndex) => (
                                            <React.Fragment key={groupIndex}>
                                                {/* Wrapper around each 5 itinerary cards */}
                                                <div className={`px-0 lg:px-0 lg:mx-auto ${innerWidth > 600 ? '' : ''}`}>
                                                    {group.map((item: any, index: number) => {
                                                        const absoluteIndex = groupIndex * 3 + index;
                                                        const showFreeCancellationStripe = isAfter7Days(item.start_date);
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                ref={absoluteIndex === itineraryData.length - 1 ? lastCardRef : null}
                                                            >
                                                                <ItineraryCardNew data={item} index={absoluteIndex} callback={() => setAuthModal(true)} showFreeCancellationStripe={showFreeCancellationStripe} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Banner below every 5 cards and skip banner at the last */}
                                                {groupIndex < chunkedItineraries.length - 1 && leadsBannerImages?.length > 0 && <div className='mb-6 cursor-pointer' onClick={() => handleBannerClick(leadsBannerImages[groupIndex % leadsBannerImages.length])}>
                                                    {/* Mobile banner */}
                                                    <img
                                                        src={leadsBannerImages[groupIndex % leadsBannerImages.length]?.mobile}
                                                        alt={`Banner mobile ${groupIndex + 1}`}
                                                        className='block lg:hidden w-full'
                                                    />
                                                    {/* Desktop banner */}
                                                    <img
                                                        src={leadsBannerImages[groupIndex % leadsBannerImages.length]?.desktop}
                                                        alt={`Banner desktop ${groupIndex + 1}`}
                                                        className='hidden lg:block w-full rounded-md'
                                                    />
                                                </div>}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                </div>

                                {hasMore && (
                                    <div className="text-center my-6">
                                        <Button isLoading={showLoadMoreLoader} text="Load More" rightIcon={<img className='h-4' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/load-more-icon-white.svg' />} size="base" handleClick={handleLoadMore} className='!px-8' />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProfileAuthV2
                authModal={authModal}
                pageCode="idle_login"
                setAuthModal={() => setAuthModal(false)}
                callback={() => {
                    setAuthModal(false);
                    createCouponCode();
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
            // itineraryId={itineraryId}
            />

            <Modal show={couponModal} align={'center'} mainClassName='!z-[10000]' className=" w-full lg:w-[30%] center overflow-hidden left-0 right-0 m-auto top-0 bottom-0 relative"
                onClose={() => {
                    setCouponModal(false)
                }}
            >
                <div className='flex items-center justify-center p-4 pb-0 absolute right-3 top-0 z-[1] w-[30px] h-[30px]'>
                    <p className='text-base lg:text-xl font-bold cursor-pointer' onClick={() => {
                        setCouponModal(false)
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
                            handleClick={() => setCouponModal(false)}
                            text='Continue'
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


            <Modal
                show={mainMobileFilterModal}
                align={'center'}
                className="max-h-[100%] overflow-y-scroll no-scrollbar drop-shadow absolute w-[100%] center overflow-hidden left-0 right-0 top-0 m-auto"
                mainClassName="px-0"
                onClose={() => {
                    setMainMobileFilterModal(false)
                }}>
                <div className='overflow-scroll no-scrollbar h-[99%]'>
                    <div className='bg-white h-[100%]'>
                        <div className='border-b border-gray-300 p-4 flex items-center justify-between'>
                            <h1 className='text-base font-semibold'>Explore Cruise Holiday</h1>
                            <svg
                                onClick={() => setMainMobileFilterModal(false)}
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-black cursor-pointer"
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
                        <div className='p-4'>
                            <div className='p-4 border border-gray-300/80 rounded'>
                                <div
                                    onClick={() => {
                                        setSecondaryMobileFilterModal('destination')
                                        setMainMobileFilterModal(false)
                                    }}
                                    id="upc_mobile_destinations_ports"
                                    className="bg-gray-300/50 shadow-allSide rounded-md p-3 border border-gray-300/50 mb-4 cursor-pointer"
                                >
                                    <p className="text-xs font-medium">Select Destination</p>
                                    <p className={`text-sm font-semibold ${tempDestinationFilter && tempDestinationFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                        {tempDestinationFilter && tempDestinationFilter.length ? tempDestinationFilter.length > 2 ? `${tempDestinationFilter[0]}, ${tempDestinationFilter[1]}...+${tempDestinationFilter.length - 2}` : tempDestinationFilter.join(', ') : 'Where to?'}
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSecondaryMobileFilterModal('month')
                                        setMainMobileFilterModal(false)
                                    }}
                                    id="upc_mobile_months"
                                    className="bg-gray-300/50 shadow-allSide rounded-md p-3 border border-gray-300/70 mb-4 cursor-pointer"
                                >
                                    <p className="text-xs font-medium">Select Month</p>
                                    <p className={`text-sm font-semibold ${tempMonthFilter && tempMonthFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                        {tempMonthFilter && tempMonthFilter.length ? tempMonthFilter.length > 2 ? `${tempMonthFilter[0]}, ${tempMonthFilter[1]}...+${tempMonthFilter.length - 2}` : tempMonthFilter.join(', ') : 'Travel month?'}
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSecondaryMobileFilterModal('nights')
                                        setMainMobileFilterModal(false)
                                    }}
                                    id="upc_mobile_nights"
                                    className="bg-gray-300/50 shadow-allSide rounded-md p-3 border border-gray-300/70 mb-4 cursor-pointer"
                                >
                                    <p className="text-xs font-medium">Select Night</p>
                                    <p className={`text-sm font-semibold ${tempNoOfNightFilter && tempNoOfNightFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                        {tempNoOfNightFilter && tempNoOfNightFilter.length ? tempNoOfNightFilter.length > 2 ? `${tempNoOfNightFilter[0]}N, ${tempNoOfNightFilter[1]}N...+${tempNoOfNightFilter.length - 2}` : tempNoOfNightFilter.map((item: number) => `${item}N`).join(', ') : 'Nights?'}
                                    </p>
                                </div>
                                <div
                                    onClick={() => {
                                        setSecondaryMobileFilterModal('cruise')
                                        setMainMobileFilterModal(false)
                                    }}
                                    id="upc_mobile_cruise"
                                    className="bg-gray-300/50 shadow-allSide rounded-md p-3 border border-gray-300/70 cursor-pointer"
                                >
                                    <p className="text-xs font-medium">Select Cruise</p>
                                    <p className={`text-sm font-semibold ${tempCruiseFilter && tempCruiseFilter.length ? 'text-black' : 'text-gray-100'}`}>
                                        {tempCruiseFilter && tempCruiseFilter.length
                                            ? tempCruiseFilter.length > 2
                                                ? `${tempCruiseFilter[0].name}, ${tempCruiseFilter[1].name}...+${tempCruiseFilter.length - 2}`
                                                : tempCruiseFilter.map((item: any) => item.name).join(', ')
                                            : 'Cruise name?'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='w-full px-4 pb-6'>
                            <Button text="Apply" size="base" handleClick={() => {
                                applyFilter()
                                setMainMobileFilterModal(false)
                            }} />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                show={secondaryMobileFilterModal}
                align={'center'}
                className="max-h-[100%] overflow-y-scroll no-scrollbar drop-shadow absolute w-[100%] center overflow-hidden left-0 right-0 bottom-0 m-auto"
                mainClassName="px-0"
                onClose={() => {
                    setSecondaryMobileFilterModal(null)
                }}>
                <div className='overflow-scroll no-scrollbar h-[99%]'>
                    <div className='bg-white h-[100%]'>
                        <div className='p-4 flex items-start justify-between'>
                            {secondaryMobileFilterModal === 'destination' && <p className="text-base font-semibold pr-4">Which destination would you like to cruise to?</p>}
                            {secondaryMobileFilterModal === 'month' && <p className="text-base font-semibold pr-4">Which month would you prefer to cruise?</p>}
                            {secondaryMobileFilterModal === 'nights' && <p className="text-base font-semibold pr-4">How many nights would you like to cruise with us?</p>}
                            {secondaryMobileFilterModal === 'cruise' && <p className="text-base font-semibold pr-4">Ready to sail? Choose your cruise</p>}
                            <svg
                                onClick={() => setSecondaryMobileFilterModal(null)}
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-black cursor-pointer mt-1"
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
                        <div className='p-4'>
                            {secondaryMobileFilterModal === 'destination' && (
                                <div className="">
                                    <div className="mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {portsList && [...portsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                                return (
                                                    <span
                                                        onClick={() => setTempFilterData('destination', val.name)}
                                                        className={`text-xxs font-medium px-3 py-1.5 rounded border-gray-100/5 cursor-pointer ${tempDestinationFilter.includes(val.name) ? 'bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white' : 'bg-gray-100/10 text-black'}`}
                                                    >
                                                        {val.name}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-4 gap-4">
                                        {/* <button onClick={() => setTempDestinationFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                                        <button
                                            onClick={() => {
                                                setMainMobileFilterModal(true)
                                                setSecondaryMobileFilterModal(null)
                                            }}
                                            className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold"
                                        >
                                            Done
                                        </button> */}
                                        <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempDestinationFilter([])} className='w-1/2' />
                                        <Button text='DONE' size='sm' handleClick={() => {
                                            setMainMobileFilterModal(true)
                                            setSecondaryMobileFilterModal(null)
                                        }} className='w-full' />
                                    </div>
                                </div>
                            )}
                            {secondaryMobileFilterModal === 'month' && (
                                <div className="">
                                    <div className="mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {availableDates.map((date: any) => {
                                                return (
                                                    <span
                                                        onClick={() => setTempFilterData('month', date)}
                                                        className={`text-xxs font-medium px-3 py-1.5 rounded border-gray-100/5 cursor-pointer ${tempMonthFilter.includes(date) ? 'bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white' : 'bg-gray-100/10 text-black'}`}
                                                    >
                                                        {moment(date, "MM-YYYY").format("MMM YY")}
                                                    </span>
                                                )
                                            }
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-4 gap-4">
                                        {/* <button onClick={() => setTempMonthFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                                        <button
                                            onClick={() => {
                                                setMainMobileFilterModal(true)
                                                setSecondaryMobileFilterModal(null)
                                            }}
                                            className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold"
                                        >
                                            Done
                                        </button> */}
                                        <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempMonthFilter([])} className='w-1/2' />
                                        <Button text='DONE' size='sm' handleClick={() => {
                                            setMainMobileFilterModal(true)
                                            setSecondaryMobileFilterModal(null)
                                        }} className='w-full' />
                                    </div>
                                </div>
                            )}
                            {secondaryMobileFilterModal === 'nights' && (
                                <div className="">
                                    <div className="mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {nightList.map((val: any, i: number) => {
                                                return (
                                                    <span
                                                        onClick={() => setTempFilterData('nights', val)}
                                                        className={`text-xxs font-medium px-3 py-1.5 rounded border-gray-100/5 cursor-pointer ${tempNoOfNightFilter.includes(val) ? 'bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white' : 'bg-gray-100/10 text-black'}`}
                                                    >
                                                        {val} Nights
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-4 gap-4">
                                        {/* <button onClick={() => setTempNoOfNightFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                                        <button
                                            onClick={() => {
                                                setMainMobileFilterModal(true)
                                                setSecondaryMobileFilterModal(null)
                                            }}
                                            className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold"
                                        >
                                            Done
                                        </button> */}
                                        <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempNoOfNightFilter([])} className='w-1/2' />
                                        <Button text='DONE' size='sm' handleClick={() => {
                                            setMainMobileFilterModal(true)
                                            setSecondaryMobileFilterModal(null)
                                        }} className='w-full' />
                                    </div>
                                </div>
                            )}
                            {secondaryMobileFilterModal === 'cruise' && (
                                <div className="">
                                    <div className="mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {shipsList.map((val: any, i: number) => {
                                                return (
                                                    <span
                                                        onClick={() => setTempFilterData('cruise', val)}
                                                        className={`text-xxs font-medium px-3 py-1.5 rounded border-gray-100/5 cursor-pointer ${tempCruiseFilter.some(c => c.name === val.name) ? 'bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] text-white' : 'bg-gray-100/10 text-black'}`}
                                                    >
                                                        {val.name}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-4 gap-4">
                                        {/* <button onClick={() => setTempCruiseFilter([])} className="w-1/2 border border-brand-primary text-brand-primary px-6 py-2.5 rounded-md font-semibold">RESET</button>
                                        <button
                                            onClick={() => {
                                                setMainMobileFilterModal(true)
                                                setSecondaryMobileFilterModal(null)
                                            }}
                                            className="w-full bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold"
                                        >
                                            Done
                                        </button> */}
                                        <Button text='RESET' size='sm' type='secondary' handleClick={() => setTempCruiseFilter([])} className='w-1/2' />
                                        <Button text='DONE' size='sm' handleClick={() => {
                                            setMainMobileFilterModal(true)
                                            setSecondaryMobileFilterModal(null)
                                        }} className='w-full' />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* main filter */}
            <Modal show={mainFilter} align={'center'} className="max-h-[70%] overflow-y-scroll no-scrollbar drop-shadow bg-white w-[90%] lg:w-[40%] center bottom-1/4 rounded-lg lg:rounded border overflow-hidden left-0 right-0 m-auto" onClose={() => {
                setMainFilter(false)
            }}>
                <div className='border-b border-gray-300 p-4 mb-4 flex items-center justify-between'>
                    <h1 className='text-2xl font-semibold'>Filters</h1>
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
                <div className='px-6 pb-8'>
                    <div>
                        <p className='font-semibold'>Trip Type</p>
                        <div className='flex mt-2 gap-2'>
                            <div onClick={() => setTempFilterData('trip', 'one_way')} className={`flex text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempTripTypeFilter.includes('one_way') ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}>
                                <img className='mr-2' src={`${tempTripTypeFilter.includes('one_way') ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway_white.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-black-icon.svg'}`} alt="" />
                                <p className='text-xxs lg:text-sm font-normal'>One Way</p>
                            </div>
                            <div onClick={() => setTempFilterData('trip', 'round')} className={`flex text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempTripTypeFilter.includes('round') ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}>
                                <img className='mr-2' src={`${tempTripTypeFilter.includes('round') ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip_white.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-black-icon.svg'}`} alt="" />
                                <p className='text-xxs lg:text-sm font-normal'>Round Trip</p>
                            </div>
                        </div>
                    </div>
                    <div className='mt-5'>
                        <p className='font-semibold'>Departure Port</p>
                        <div className='flex flex-wrap gap-2 mt-2'>
                            {origin && origin.map((val: any, i: number) => {
                                return (
                                    <div
                                        onClick={() => setTempFilterData('origin', val.name)}
                                        key={i}
                                        className={`text-xxs font-medium px-3 py-1.5 rounded bg-gray-100/10 border-gray-100/5 cursor-pointer from-brand-primary to-brand-secondary hover:text-white ${tempOriginFilter.includes(val.name) ? 'bg-gradient-to-r text-white' : 'hover:bg-gradient-to-r text-black'}`}
                                    >
                                        <p className='text-xxs lg:text-sm font-normal'>{val.name}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className='border-t border-gray-300 my-4 w-full' />
                    <div className='flex justify-center gap-4'>
                        <div className='mt-3 w-[150px]'>
                            <Button text='Reset All' size='base' type='secondary' handleClick={() => {
                                setTempTripTypeFilter([])
                                setTempOriginFilter([])
                            }} className='w-full' />
                        </div>
                        <div className='mt-3 w-[150px]'>
                            <Button text='Apply' size='base' handleClick={() => {
                                applyFilter();
                                setMainFilter(false);
                                trackCustomEvent(ANALYTICS_EVENTS.FILTER_BY, {
                                    trip_type: tempTripTypeFilter.join(", ") || "",
                                    departure_port: tempOriginFilter.join(", ") || "",
                                    filter_apply: "Apply",
                                    destination_name: portSelector || "",
                                    cruise_search_results: itineraryData?.length || 0,
                                    page_url: window.location.href,
                                });
                            }} className='w-full' />
                        </div>
                    </div>
                </div>
            </Modal>

            {isOpenNewSortAndFilter && <NewSortAndFilterBottomSheet />}

            <Modal
                show={mobileCallClick}
                align={'center'}
                className="w-[100%] relative rounded-md overflow-hidden"
                mainClassName='px-0 !items-end'
                onClose={() => setMobileCallClick(false)}
            >
                <CallbackSide callback={() => {
                    setMobileCallClick(false)
                    handleOpenReqCallback('upc_rac')
                }} />
            </Modal>

            <Modal show={showSuccessModal} align={'center'} className="w-[85%] lg:w-[40%] relative border-t-4 border-brand-primary rounded-md overflow-hidden" onClose={() => setShowSuccessModal(false)}>
                <div className='w-full h-full bg-white shadow-lg'>
                    <div className='absolute right-3 top-3'>
                        <svg onClick={() => setShowSuccessModal(false)} xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className='min-h-[100px] pt-10 px-5 lg:pt-7 pb-10 rounded-md overflow-hidden'>
                        <div className='flex justify-center mb-5'>
                            <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/icon_success_green.svg" alt="success_icon" />
                        </div>
                        <p className='text-md text-gray-700 text-center font-semibold'>{success}</p>
                    </div>
                </div>
            </Modal>

            {/* ── Benefits Modal / BottomSheet ── */}
            {activeModal && (() => {
                return window.innerWidth < 768 ? (
                    <BottomSheet
                        isOpen={!!activeModal}
                        setIsOpen={(val) => !val && setActiveModal(null)}
                        onClose={() => setActiveModal(null)}
                        hasBtns={false}
                        contentClassName="!pr-0 !max-h-[80vh] !px-0"
                        className="!p-0"
                    >
                        <BenefitsModalContent
                            benefits={Benefits}
                            activeId={activeModal}
                            setActiveId={setActiveModal}
                            onClose={() => setActiveModal(null)}
                        />
                    </BottomSheet>
                ) : (
                    <Modal
                        show={!!activeModal}
                        align="center"
                        className="drop-shadow bg-white w-full lg:w-[55%] h-[80vh] max-h-[max-content] rounded-xl overflow-hidden absolute top-20"
                        mainClassName="!items-center !z-[10000] !fixed"
                        onClose={() => setActiveModal(null)}
                    >
                        <div className="relative bg-white rounded-xl w-full h-[80vh] max-h-[max-content] mx-auto overflow-hidden">
                            <button
                                onClick={() => setActiveModal(null)}
                                className="absolute top-4 right-4 z-20 text-gray-600 hover:text-black"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                            <BenefitsModalContent
                                benefits={Benefits}
                                activeId={activeModal}
                                setActiveId={setActiveModal}
                                onClose={() => setActiveModal(null)}
                            />
                        </div>
                    </Modal>
                );
            })()}

            <IdleModal
                initOpen={idle?.isIdle}
                title='Still deciding where to cruise? Get curated guidance from a specialist.'
                subTitle='Let our expert match you with an itinerary that suits your taste.'
                isLoggedIn={token ? true : false}
                setAuthModal={setAuthModal}
                onClose={idle.resumeTimer}
            />


            <RequestCallbackModal initOpen={showRequestACallback} onClose={() => setShowRequestACallback(false)} pageCode={pageCode} />

            <CruiseChatbot
                availablePorts={chatbotPortNames}
                availableOrigins={chatbotOriginNames}
                availableDates={availableDates || []}
                availableNights={chatbotNights}
                itineraryCount={itineraryData?.length || 0}
                isLoading={isLoading}
                itineraries={chatbotItineraries}
                onApplyFilters={applyFromChatbot}
                onResetFilters={resetFromChatbot}
            />
        </Layout>
    );
}
