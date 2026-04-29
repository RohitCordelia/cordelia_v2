import React, { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout';
import Modal from '../../components/UI/ModalCenter';
import { useGetItineraryListMutation } from '../../services/upcomingCruise/upcomingCruise';
import "./index.css";
import ItineraryCard from './component/itineraryCard';
import Calendar from './component/calendar';
import moment from 'moment';
import Banner from '../../component/Banner';
import { GetAuth, SaveAB, GetAB, SaveAuth  } from '../../utils/store/store';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../../component/Login';
import useHorizontalScroll from '../../utils/customHooks/useHorizontalScroll';
import { useSttLoginMutation } from '../../services/auth/auth';
import ProfileAuth from '../profile/auth';

type Props = {}

const banner = {
    "images": [
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/moonlight-saving-desktop-banner-image-01.webp",
            "link": "#",
            "type": "image",
            "altTag": "Night mode",
            "thumbnail": "",
            "startTime": "10:01 PM",
            "endTime": "06:00 AM",
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/moonlight-saving-desktop-banner-image-02.webp",
            "link": "#",
            "type": "image",
            "altTag": "Night mode",
            "thumbnail": "",
            "startTime": "10:01 PM",
            "endTime": "06:00 AM",
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/alcohol-offer-itinerary-new-banner-desktop.webp",
            "link": "",
            "type": "image",
            "altTag": "Alcohal",
            "thumbnail": ""
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/kidsail-offer-itinerary-new-banner-desktop.webp",
            "link": "",
            "type": "image",
            "altTag": "Alcohal",
            "thumbnail": ""
        },
    ],
    "mobileImages": [
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/moonlight-saving-mobile-banner-image-01.webp",
            "link": "#",
            "type": "image",
            "altTag": "Night mode",
            "thumbnail": "",
            "startTime": "10:01 PM",
            "endTime": "06:00 AM",
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/moonlight-saving-mobile-banner-image-02.webp",
            "link": "#",
            "type": "image",
            "altTag": "Night mode",
            "thumbnail": "",
            "startTime": "10:01 PM",
            "endTime": "06:00 AM",
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/alcohol-offer-itinerary-new-banner-mobile.webp",
            "link": "",
            "type": "image",
            "altTag": "Alcohal",
            "thumbnail": ""
        },
        {
            "url": "https://images.cordeliacruises.com/cordelia_v2/public/images/kidsail-offer-itinerary-new-banner-mobile.webp",
            "link": "",
            "type": "image",
            "altTag": "Alcohal",
            "thumbnail": ""
        }
    ],
}

export default function PaymentSuccess({ }: Props) {
    const monthParam = new window.URLSearchParams(window.location.search).get('m');
    const yearParam = new window.URLSearchParams(window.location.search).get('y');
    const monthYearParam = new window.URLSearchParams(window.location.search).get('month_year');
    const dateAfterParam = new window.URLSearchParams(window.location.search).get('da');
    const dateBeforeParam = new window.URLSearchParams(window.location.search).get('db');
    const startSelector = new window.URLSearchParams(window.location.search).get('start');
    const portSelector = new window.URLSearchParams(window.location.search).get('port');
    const nightSelector = new window.URLSearchParams(window.location.search).get('n');
    const destinationPortsSelector = new window.URLSearchParams(window.location.search).get('destinationPorts');
    const itinerarySelector = new window.URLSearchParams(window.location.search).get('itinerary_id');
    const stt = new window.URLSearchParams(window.location.search).get('stt');
    const AUTH = GetAuth();
    const ab = GetAB();
    let navigate = useNavigate();
    const [getItinerary] = useGetItineraryListMutation();
    const [SttLogin] = useSttLoginMutation();
    const [itineraryData, setItineraryData] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [portsList, setPortsList] = useState<any>();
    const [shipsList, setShipsList] = useState<any>();
    const [dateFilter, setDateFilter] = useState<boolean>(false);
    const [mainFilter, setMainFilter] = useState<boolean>(false);
    const [datesToHighlight, setDatesToHighlight] = useState<any>([]);
    const [startDateFilter, setStartDateFilter] = useState<any>();
    const [endDateFilter, setEndDateFilter] = useState<any>();
    const [tempStartDateFilter, setTempStartDateFilter] = useState<any>();
    const [tempEndDateFilter, setTempEndDateFilter] = useState<any>();
    const [filteredItineraryData, setFilteredItineraryData] = useState<any>(null);

    const [origin, setOrigin] = useState<any>();
    const [destination, setDestination] = useState();
    const [tripType, setTripType] = useState<any>();
    const [noOfNight, setNoOfNight] = useState<any>();
    const [month, setMonth] = useState<any>();

    const [originFilter, setOriginFilter] = useState<any>([]);
    const [tempOriginFilter, setTempOriginFilter] = useState<any>([]);
    const [destinationFilter, setDestinationFilter] = useState<any>([]);
    const [cruiseFilter, setCruiseFilter] = useState<any>([]);
    const [tempDestinationFilter, setTempDestinationFilter] = useState<any>([]);
    const [tempCruiseFilter, setTempCruiseFilter] = useState<any>([]);
    const [monthFilter, setMonthFilter] = useState<any>([]);
    const [tempMonthFilter, setTempMonthFilter] = useState<any>([]);
    const [tripTypeFilter, setTripTypeFilter] = useState<any>([]);
    const [tempTripTypeFilter, setTempTripTypeFilter] = useState<any>([]);
    const [noOfNightFilter, setNoOfNightFilter] = useState<any[]>([]);
    const [tempNoOfNightFilter, setTempNoOfNightFilter] = useState<any[]>([]);
    const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
    const [selectedItinerary, setSelectedItinerary] = useState<string>('');
    const [activeSortAndFilter, setActiveSortAndFilter] = useState("filterBy");
    const [activeFilter, setActiveFilter] = useState("destinations");
    const [isOpenNewFilters, setIsOpenNewFilters] = useState(false);
    const [isOpenNewSortAndFilter, setIsOpenNewSortAndFilter] = useState(false);
    const [showFilter, setShowFilter] = useState(true);
    const [sortByPopover, setSortByPopover] = useState(false);
    const [token, setToken] = React.useState('');

    const destinationScroll = useHorizontalScroll();
    const cruiseScroll = useHorizontalScroll();
    const nightsScroll = useHorizontalScroll();
    const monthScroll = useHorizontalScroll();

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
        setToken(GetAuth()?.token)
    }, [GetAuth()])

    useEffect(() => {
        if (stt && !AUTH?.token) {
            const _payload = { refresh_token: stt };
            SttLogin(_payload)
                .unwrap()
                .then((response) => {
                    SaveAuth(response?.data?.login_response)
                })
                .catch((response) => {
                    // setError('otp', { type: 'custom', message: response?.message || 'Failed to verify OTP' });
                })
        }
    }, [stt])



    useEffect(() => {
        if (startSelector) {
            let arr = originFilter;
            arr.push(startSelector)
            setTempOriginFilter([...arr])
        }
        if (portSelector) {
            let arr = destinationFilter;

            arr.push(portSelector)
            setTempDestinationFilter([...arr])
        }
        if (destinationPortsSelector) {
            var array = destinationPortsSelector.split(",");
            setTempDestinationFilter([...array])
        }
        if (nightSelector) {
            var array = nightSelector.split(",").map(Number);
            setTempNoOfNightFilter([...array])
        }
        if (monthYearParam) {
            let arr = tempMonthFilter;

            arr.push(monthYearParam)
            setTempMonthFilter([...arr])
        }
    }, [startSelector, portSelector, destinationPortsSelector, nightSelector, monthYearParam])

    useEffect(() => {
        const body = document.querySelector('body');
        body.style.overflow = isLoading ? 'hidden' : 'auto';
    }, [isLoading])

    useEffect(() => {
        setIsLoading(true)
        getItinerary()
            .unwrap()
            .then((res: any) => {
                setItineraryData(res)
                const filteredItineraries = res?.itineraries.map((itinerary: any) => itinerary.start_date);
                setDatesToHighlight(filteredItineraries)
                if (res && res.ports) {
                    setPortsList(res.ports)
                }
                if (res && res.ships) {
                    setShipsList(res.ships)
                }
                setIsLoading(false)
                window.scroll({
                    top: 0,
                    left: 0
                });
            })
            .catch((res: any) => {
                setIsLoading(false)
                console.log('Error: ', res)
            })
    }, [])

    useEffect(() => {
        handleFilterItinerary()
    }, [itineraryData, tempDestinationFilter, tempCruiseFilter, tempNoOfNightFilter, tempMonthFilter])

    useEffect(() => {
        let origin: any = []
        if (itineraryData && itineraryData.ports) {
            origin = itineraryData.ports.filter((port: any) => port.origin)
        }
        setOrigin(origin)

        let destination: any = []
        if (itineraryData && itineraryData.ports) {
            destination = itineraryData.ports.filter((port: any) => port.destination)
        }
        setDestination(destination)

        let trip: any = []
        if (itineraryData && itineraryData.itineraries) {
            trip = itineraryData.itineraries.map((item: any) => item.trip_type).filter((value: any, index: any, self: any) => self.indexOf(value) === index);
        }
        setTripType(trip)

        let night: any = []
        if (itineraryData && itineraryData.itineraries) {
            night = [...new Set(itineraryData.itineraries.map((item: any) => item.nights))].sort((a, b) => a - b);
            // night = itineraryData.itineraries.map((item: any) => item.nights).filter((value: any, index: any, self: any) => self.indexOf(value) === index);
        }
        setNoOfNight(night)

        let month: any = []
        if (itineraryData && itineraryData.itineraries) {
            month = [...new Set(itineraryData.itineraries.map((item: any) => item.month_year))];
        }
        setMonth(month)
    }, [itineraryData])

    const handleSortBy = (sortType: string) => {
        if (!filteredItineraryData) return;
    
        const sortedData = [...filteredItineraryData] // Avoid mutating original array
            .filter((itinerary: any) => itinerary?.starting_fare || sortType === "earliest_departure")
            .sort((a, b) => {
                const sortOptions: Record<string, number> = {
                    lowest_price: a.starting_fare - b.starting_fare,
                    highest_price: b.starting_fare - a.starting_fare,
                    earliest_departure: moment(a.start_date, "DD/MM/YYYY").valueOf() - moment(b.start_date, "DD/MM/YYYY").valueOf(),
                };
                return sortOptions[sortType] ?? 0; // Default to no sorting if invalid sortType
            });
    
        setFilteredItineraryData(sortedData);
        setIsOpenNewSortAndFilter(false);
        setSortByPopover(false);
    };

    const handleFilterItinerary = (e: any = null) => {
        let result = itineraryData?.itineraries
        if (itinerarySelector) {
            result = result?.filter((itinerary: any) => itinerary.itinerary_id === itinerarySelector)
        }
        if (monthParam && yearParam) {
            let monthParams: number = +monthParam;
            let yearParams: number = +yearParam;
            result = result?.filter((item: any) => {
                const itemDate = moment(item.start_date, "DD/MM/YYYY");
                const itemMonth = itemDate.month() + 1; // month() is 0-indexed, so we add 1
                const itemYear = itemDate.year();
                return itemYear > yearParams || (itemYear === yearParams && itemMonth > monthParams);
            });
        }
        if (dateAfterParam) {
            const formattedDateAfterParam = moment(dateAfterParam, "DDMMYYYY");
            result = result?.filter((item: any) => {
                const itemDate = moment(item.start_date, "DD/MM/YYYY");
                return itemDate.isAfter(formattedDateAfterParam);
            });
        }
        if (dateBeforeParam) {
            const formattedDateBeforeParam = moment(dateBeforeParam, "DDMMYYYY");
            result = result?.filter((item: any) => {
                const itemDate = moment(item.start_date, "DD/MM/YYYY");
                return itemDate.isBefore(formattedDateBeforeParam);
            });
        }

        if (tempOriginFilter && tempOriginFilter.length) {
            result = result?.filter((o: any) => {
                if (tempOriginFilter?.includes(o.starting_port.name)) {
                    return true
                }
            });
            setOriginFilter(tempOriginFilter)
        }
        if (tempDestinationFilter && tempDestinationFilter.length) {
            result = result?.filter((item: any) => {
                for (let i = 0; i < item.ports.length; i++) {
                    if (tempDestinationFilter?.includes(item.ports[i].name)) {
                        return true
                    }
                }
            });
            setDestinationFilter(tempDestinationFilter)
        }
        if (tempCruiseFilter && tempCruiseFilter.length) {
            result = result?.filter((item: any) => tempCruiseFilter?.includes(item.ship.name));
            setCruiseFilter(tempCruiseFilter)
        }

        if (tempMonthFilter && tempMonthFilter.length) {
            result = result?.filter((item: any) => {
                if (tempMonthFilter?.includes(item.month_year)) {
                    return true
                }
            });
            setMonthFilter(tempMonthFilter)
        }

        if (tempNoOfNightFilter && tempNoOfNightFilter.length) {
            result = result?.filter((o: any) => {
                if (tempNoOfNightFilter?.includes(o.nights)) {
                    return true
                }
            });
            setNoOfNightFilter(tempNoOfNightFilter)
        }
        if (tempTripTypeFilter && tempTripTypeFilter.length) {
            result = result?.filter((o: any) => {
                if (tempTripTypeFilter?.includes(o.trip_type)) {
                    return true
                }
            });
            setTripTypeFilter(tempTripTypeFilter)
        }

        if (tempStartDateFilter && tempEndDateFilter) {
            result = result.filter((item: any) => {
                const itemDate = moment(item.start_date, 'DD/MM/YYYY');
                setStartDateFilter(tempStartDateFilter)
                setEndDateFilter(tempEndDateFilter)
                return itemDate.isBetween(moment(tempStartDateFilter, 'DD/MM/YYYY'), moment(tempEndDateFilter, 'DD/MM/YYYY'), null, '[]');
            });
        }
        setFilteredItineraryData(result)
    }

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
        if (name == 'cruise') {
            let arr: any = JSON.parse(JSON.stringify(tempCruiseFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempCruiseFilter([...arr])
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
        if (name == 'night') {
            let arr: any = JSON.parse(JSON.stringify(tempNoOfNightFilter));
            if (arr.includes(value)) {
                arr = arr.filter((item: any) => item !== value)
            } else {
                arr.push(value)
            }
            setTempNoOfNightFilter([...arr])
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

        // Scroll to Cruise Search Results
        window.scrollTo({ top: innerWidth > 768 ? 450 : 300 });
    }

    const DateFilter = (e: any) => {
        let startDate = e[0]?.format('DD/MM/YYYY')
        let endDate = e[1]?.format('DD/MM/YYYY')
        setTempStartDateFilter(startDate)
        setTempEndDateFilter(endDate)
    }

    const ResetFilter = () => {
        setOriginFilter([])
        setTripTypeFilter([])
        setNoOfNightFilter([])
        setTempOriginFilter([])
        setTempTripTypeFilter([])
        setTempNoOfNightFilter([])

        let result = itineraryData?.itineraries
        if (tempStartDateFilter && tempEndDateFilter) {
            result = result.filter((item: any) => {
                const itemDate = moment(item.start_date, 'DD/MM/YYYY');
                setStartDateFilter(tempStartDateFilter)
                setEndDateFilter(tempEndDateFilter)
                return itemDate.isBetween(moment(tempStartDateFilter, 'DD/MM/YYYY'), moment(tempEndDateFilter, 'DD/MM/YYYY'), null, '[]');
            });
        }

        if (tempDestinationFilter && tempDestinationFilter.length) {
            result = result?.filter((item: any) => {
                for (let i = 0; i < item.ports.length; i++) {
                    if (tempDestinationFilter?.includes(item.ports[i].name)) {
                        return true
                    }
                }
            });
            setDestinationFilter(tempDestinationFilter)
        }

        if (tempCruiseFilter && tempCruiseFilter.length) {
            result = result?.filter((item: any) => tempCruiseFilter?.includes(item.ship.name));
            setCruiseFilter(tempCruiseFilter)
        }

        setFilteredItineraryData(result)
    }

    const onLogin = (itinerary_id) => {
        setSelectedItinerary(itinerary_id)
        setShowLoginModal(true)
    }

    const NewFiltersBottomSheet = () => {
        return (
            <>
                <div
                    className={`fixed inset-0 bg-black bg-opacity-70 transition-opacity duration-300 z-30 ${
                        isOpenNewFilters ? "!bg-opacity-70 visible" : "bg-opacity-0 invisible"
                    }`}
                    onClick={() => setIsOpenNewFilters(false)}
                />
    
                {/* Bottom Sheet */}
                <div
                    className={`fixed left-0 w-full -bottom-[45%] bg-white p-4 rounded-t-2xl shadow-lg transition-all duration-300 ease-in z-30 `}
                    style={{
                        bottom: isOpenNewFilters ? "0" : "",
                    }}
                >
                    {/* Sheet Header */}
                    <div className="flex justify-between pb-4 border-b border-gray-300">
                        <h3 className="text-xl font-bold font-openSans">Select {activeFilter === "destinations" ? "Destinations" : activeFilter === "nights" ? "Nights" : activeFilter === "month" ? "Month" : activeFilter === "cruise" ? "Cruise" : ""}</h3>
                        <button
                            onClick={() => setIsOpenNewFilters(false)}
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

                    {/* Sheet Content */}
                    <div className='max-h-96 overflow-y-auto'>
                        <div className='flex flex-wrap gap-3 py-3 mt-3'>
                            {activeFilter === "destinations" && portsList && [...portsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                return (
                                    <div onClick={() => setTempFilterData('destination', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempDestinationFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                        <p className='text-xs lg:text-sm font-semibold'>{val.name}</p>
                                    </div>
                                )
                            })}
                            {activeFilter === "cruise" && shipsList && [...shipsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                return (
                                    <div onClick={() => setTempFilterData('cruise', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempCruiseFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                        <p className='text-xs lg:text-sm font-semibold'>{val.name}</p>
                                    </div>
                                )
                            })}
                            {activeFilter === "nights" && noOfNight && noOfNight.map((val: any) => {
                                return (
                                    <div onClick={() => setTempFilterData('night', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempNoOfNightFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                        <p className='text-xs lg:text-sm font-semibold'>{val}</p>
                                    </div>
                                )
                            })}
                            {activeFilter === "month" && month && month?.map((val: any) => {
                                return (
                                    <div onClick={() => setTempFilterData('month', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempMonthFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                        <p className='text-xs lg:text-sm font-semibold'>{val}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
        
                    {/* Action Buttons */}
                    <div className='flex gap-3'>
                        <button
                            // onClick={() => {
                            //     activeFilter === "destinations" && setTempDestinationFilter([]);
                            //     activeFilter === "nights" && setTempNoOfNightFilter([]);
                            //     activeFilter === "month" && setTempMonthFilter([]);
                            //     setIsOpenNewFilters(false);
                            // }}
                            onClick={() => {
                                resetNewFilter();
                                setIsOpenNewFilters(false);
                            }}
                            className="mt-4 w-full py-2 bg-gray-100/5 rounded-md uppercase text-sm font-bold"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={() => setIsOpenNewFilters(false)}
                            className="mt-4 w-full py-2 bg-brand-primary text-white rounded-md uppercase text-sm font-bold"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </>
        );
    };

    const NewSortAndFilterBottomSheet = () => {
        return (
            <>
            {isOpenNewSortAndFilter &&
            <>
                <div
                    className={`fixed inset-0 bg-black bg-opacity-70 transition-opacity duration-300 z-30 ${
                        isOpenNewSortAndFilter ? "!bg-opacity-70 visible" : "bg-opacity-0 invisible"
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
                                    onClick={() => setActiveSortAndFilter("filterBy")}
                                >
                                    Filter By
                                </div>
                                <div
                                    className={`basis-1/2 pb-4 font-bold text-lg ${activeSortAndFilter === 'sortBy' ? 'border-b-2 border-brand-primary' : 'text-gray-100 border-gray-400'}`}
                                    onClick={() => setActiveSortAndFilter("sortBy")}
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
                                        <div className='flex mt-2'>
                                            {tripType && tripType.map((val: any) => {
                                                let name = null;
                                                let icon = null;
                                                let activeIcon = null;
                                                if (val == 'round') {
                                                    name = 'Round Trip'
                                                    icon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-black-icon.svg'
                                                    activeIcon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-purple-icon.svg'
                                                } else if (val == 'one_way') {
                                                    name = 'One Way Trip'
                                                    icon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-black-icon.svg'
                                                    activeIcon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-purple-icon.svg'
                                                }
                                                return (
                                                    <div onClick={() => setTempFilterData('trip', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded mr-2 border ${tempTripTypeFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                        <img className='mr-2' src={`${tempTripTypeFilter.includes(val) ? activeIcon : icon}`} alt="" />
                                                        <p className='text-xs lg:text-sm font-normal'>{name}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className='mt-5'>
                                        <p className='font-semibold'>Departure Port</p>
                                        <div className='flex flex-wrap gap-2 mt-2'>
                                            {origin && origin.map((val: any, i: number) => {
                                                return (
                                                    <div onClick={() => setTempFilterData('origin', val.name)} key={i} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempOriginFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                        <p className='text-xs lg:text-sm font-normal'>{val.name}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                    
                                {/* Action Buttons */}
                                <div className='flex gap-3'>
                                    <button
                                        onClick={() => {
                                            ResetFilter();
                                            setIsOpenNewSortAndFilter(false);
                                        }}
                                        className="mt-4 w-full py-2 bg-gray-100/5 rounded-md uppercase text-sm font-bold"
                                    >
                                        Reset All
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleFilterItinerary('click');
                                            setIsOpenNewSortAndFilter(false);
                                        }}
                                        className="mt-4 w-full py-2 bg-brand-primary text-white rounded-md uppercase text-sm font-bold"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        }
                        {activeSortAndFilter === "sortBy" && 
                            <div className='pt-6'>
                                <div
                                    className='py-3 text-sm border-b border-gray-400'
                                    onClick={() => handleSortBy("lowest_price")}
                                >
                                    <p>Price Low To High</p>
                                </div>
                                <div
                                    className='py-3 text-sm border-b border-gray-400'
                                    onClick={() => handleSortBy("highest_price")}
                                >
                                    <p>Price High To Low</p>
                                </div>
                                <div
                                    className='py-3 text-sm'
                                    onClick={() => handleSortBy("earliest_departure")}
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

    const resetNewFilter = () => {
        setTempDestinationFilter([]);
        setTempCruiseFilter([]);
        setTempNoOfNightFilter([]);
        setTempMonthFilter([]);
    }

    return (
        <Layout>
            {isLoading ?
                <div className='h-full w-full flex justify-center items-center overflow-hidden fixed bg-black/90 z-50'>
                    <img
                        className='w-32 lg:w-44'
                        src="/assets/images/cordelia-new-loader.gif"
                        alt=""
                    />
                </div>
                : null
            }
            <div className='pt-[52px] pb-24 lg:pt-[78px] lg:pb-36'>
                <Banner data={banner} />
                <div className="container mx-auto">
                    <div className="mx-auto px-4 lg:px-32 text-center pt-6 pb-8">
                        <h1 className='font-semibold text-2xl lg:text-3xl'>Explore Cruise Holidays</h1>
                    </div>
                    {/* <div className='flex justify-center'>
                        <div onClick={() => setDateFilter(true)} className='w-[300px] border border-gray-400 shadow-allSide px-4 lg:px-8 py-4 cursor-pointer flex items-center justify-between text-gray-100 text-sm lg:text-lg font-medium'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/destination-upcoming-icon.svg" alt="" />
                                <p>Destinations</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div>
                        <div onClick={() => setDateFilter(true)} className='w-[300px] border border-gray-400 shadow-allSide px-4 lg:px-8 py-4 cursor-pointer flex items-center justify-between text-gray-100 text-sm lg:text-lg font-medium'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/calendar-upcoming-icon.svg" alt="" />
                                <p>Dates</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div>
                    </div> */}
                    <div className='lg:hidden shadow-allSide sticky top-[63px] z-20 bg-white'>
                        <div className='flex justify-between text-xxs text-center font-bold overflow-x-auto'>
                            <div 
                                className={`basis-1/4 flex justify-center shrink-0 gap-1 py-4 border-b-2 
                                    ${activeFilter === "destinations" ? 'text-brand-primary border-brand-primary' : 'text-gray-100 border-b-2 border-gray-400'}
                                `}
                                onClick={() => {
                                    setActiveFilter("destinations");
                                    setShowFilter(true);
                                }}
                            >
                                <img src={activeFilter === "destinations" ? "https://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-destination-icon-purple.svg" : "http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-destination-icon-grey.svg"} alt="destination_icon" className="w-4" />
                                <p className={`${tempDestinationFilter?.length > 0 ? 'w-28' : 'w-auto'}`}>Destinations {tempDestinationFilter?.length > 0 && <span>({tempDestinationFilter?.length})</span>}</p>
                            </div>
                            <div
                                className={`basis-1/4 flex justify-center shrink-0 gap-1 py-4  border-b-2 ${activeFilter === "month" ? 'text-brand-primary border-brand-primary' : 'text-gray-100 border-b-2 border-gray-400'}`}
                                onClick={() => {
                                    setActiveFilter("month");
                                    setShowFilter(true);
                                }}
                            >
                                <img src={activeFilter === "month" ? "http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-calendar-icon-purple.svg" : "http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-calendar-icon-grey.svg"} alt="calender_icon" className="w-4" />
                                <p>Month {tempMonthFilter?.length > 0 && <span>({tempMonthFilter?.length})</span>}</p>
                            </div>
                            <div
                                className={`basis-1/4 flex justify-center shrink-0 gap-1 py-4  border-b-2 ${activeFilter === "nights" ? 'text-brand-primary border-brand-primary' : 'text-gray-100 border-b-2 border-gray-400'}`}
                                onClick={() => {
                                    setActiveFilter("nights");
                                    setShowFilter(true);
                                }}
                            >
                                <img src={activeFilter === "nights" ? "http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-nights-icon-purple.svg" : "http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-nights-icon-grey.svg"} alt="moon_icon" className="w-4" />
                                <p>Nights {tempNoOfNightFilter?.length > 0 && <span>({tempNoOfNightFilter?.length})</span>}</p>
                            </div>
                            <div 
                                className={`basis-1/4 flex justify-center shrink-0 gap-1 py-4 border-b-2 
                                    ${activeFilter === "cruise" ? 'text-brand-primary border-brand-primary' : 'text-gray-100 border-b-2 border-gray-400'}
                                `}
                                onClick={() => {
                                    setActiveFilter("cruise");
                                    setShowFilter(true);
                                }}
                            >
                                <img src={activeFilter === "cruise" ? "https://images.cordeliacruises.com/cordelia_v2/public/assets/findcruise-new-icon.svg" : "https://images.cordeliacruises.com/cordelia_v2/public/assets/Ship_gray.svg"} alt="cruise_icon" className="w-4" />
                                <p>Cruises {tempCruiseFilter?.length > 0 && <span>({tempCruiseFilter?.length})</span>}</p>
                            </div>
                        </div>
                        {showFilter && activeFilter !== null && <div className='relative'>
                            <div className='overflow-x-scroll'>
                                <div className='p-4 mr-8 flex gap-3 w-max'>
                                    {activeFilter === "destinations" && portsList && [...portsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                        return (
                                            <div onClick={() => setTempFilterData('destination', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempDestinationFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                                <p className='text-xs lg:text-sm font-semibold'>{val.name}</p>
                                                {tempDestinationFilter.includes(val.name) && 
                                                    <span className='text-xs lg:text-sm font-semibold ml-2 text-brand-primary'>
                                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                    </span>
                                                }
                                            </div>
                                        )
                                    })}
                                    {activeFilter === "cruise" && shipsList && [...shipsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                        return (
                                            <div onClick={() => setTempFilterData('cruise', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempCruiseFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                                <p className='text-xs lg:text-sm font-semibold'>{val.name}</p>
                                                {tempCruiseFilter.includes(val.name) && 
                                                    <span className='text-xs lg:text-sm font-semibold ml-2 text-brand-primary'>
                                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                    </span>
                                                }
                                            </div>
                                        )
                                    })}
                                    {activeFilter === "nights" && noOfNight && noOfNight.map((val: any) => {
                                        return (
                                            <div onClick={() => setTempFilterData('night', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempNoOfNightFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                <p className='text-xs lg:text-sm font-semibold'>{val}</p>
                                                {/* {tempNoOfNightFilter.includes(val) && <span className='ml-2 text-brand-primary'>X</span>} */}
                                            </div>
                                        )
                                    })}
                                    {activeFilter === "month" && month && month?.map((val: any) => {
                                        return (
                                            <div onClick={() => setTempFilterData('month', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempMonthFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                <p className='text-xs lg:text-sm font-semibold'>{val?.split(" ")[0].slice(0, 3) + " " + val?.split(" ")[1].slice(2)}</p>
                                                {tempMonthFilter.includes(val) && 
                                                    <span className='text-xs lg:text-sm font-semibold ml-2 text-brand-primary'>
                                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                    </span>
                                                }
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div
                                className='absolute -right-4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 py-2 rounded-l border border-gray-200'
                                onClick={() => setIsOpenNewFilters(true)}
                            >
                                <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-expand-icon.svg" alt="expand_icon" />
                            </div>
                        </div>}
                    </div>
                    <div className='hidden lg:block bg-white sticky top-[85px] py-3 z-20'>
                        <div className='flex gap-3'>
                            <div className='p-4 shadow-allSide z-20 bg-white rounded-md mb-3 w-[65%]'>
                                <div className='flex justify-between'>
                                    <div className="flex gap-1 text-gray-100">
                                        <img className='w-5' src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-destination-icon-purple.svg" alt="destination_icon" />
                                        <p className='font-semibold text-brand-primary'>Select Destinations {tempDestinationFilter?.length > 0 && <span>({tempDestinationFilter?.length})</span>}</p>
                                    </div>
                                    <div onClick={() => resetNewFilter()} className='font-semibold text-brand-primary underline uppercase cursor-pointer'>Reset All</div>
                                </div>
                                <div className='flex gap-1 basis-2/3 w-full pt-3'>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px]`}
                                        onClick={destinationScroll.scrollLeft}
                                        disabled={!destinationScroll.canScrollLeft}
                                    > 
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" alt="left_arrow" />
                                    </div>
                                        <div ref={destinationScroll.scrollRef} className='filterScroll overflow-auto'>
                                            <div className='mr-8 flex gap-3 w-max'>
                                                {portsList && [...portsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                                    return (
                                                        <div onClick={() => setTempFilterData('destination', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempDestinationFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                                            <p className='text-xs font-semibold'>{val.name}</p>
                                                            {tempDestinationFilter.includes(val.name) && 
                                                                <span className='text-xs font-semibold ml-2 text-brand-primary'>
                                                                    <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                                </span>
                                                            }
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px]`}
                                        onClick={destinationScroll.scrollRight}
                                        disabled={!destinationScroll.canScrollRight}
                                    >
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" className='rotate-180' alt="right_arrow" />
                                    </div>
                                </div>
                            </div>
                            <div className='p-4 shadow-allSide z-20 bg-white rounded-md mb-3 w-[34%]'>
                                <div className="flex gap-1 text-gray-100">
                                    <img className='w-5' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/findcruise-new-icon.svg" alt="cruise_icon" />
                                    <p className='font-semibold text-brand-primary'>Select Cruise {tempCruiseFilter?.length > 0 && <span>({tempCruiseFilter?.length})</span>}</p>
                                </div>
                                <div className='flex gap-1 basis-2/3 w-full pt-3'>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px]`}
                                        onClick={cruiseScroll.scrollLeft}
                                        disabled={!cruiseScroll.canScrollLeft}
                                    > 
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" alt="left_arrow" />
                                    </div>
                                    <div ref={cruiseScroll.scrollRef} className='filterScroll overflow-auto'>
                                        <div className='mr-8 flex gap-3 w-max'>
                                            {shipsList && [...shipsList].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((val: any, i: number) => {
                                                return (
                                                    <div onClick={() => setTempFilterData('cruise', val.name)} key={i} className={`inline-flex text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 rounded lg:text-sm border ${tempCruiseFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                                        <p className='text-xs font-semibold'>{val.name}</p>
                                                        {tempCruiseFilter.includes(val.name) && 
                                                            <span className='text-xs font-semibold ml-2 text-brand-primary'>
                                                                <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                            </span>
                                                        }
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px]`}
                                        onClick={cruiseScroll.scrollRight}
                                        disabled={!cruiseScroll.canScrollRight}
                                    >
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" className='rotate-180' alt="right_arrow" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='hidden lg:flex p-4 shadow-allSide z-20 bg-white rounded-md'>
                            <div className='flex basis-3/5 w-3/5 pr-3'>
                                <div className="flex gap-1 text-gray-100 w-[27%] items-center">
                                    <img className='w-5' src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-calendar-icon-purple.svg" alt="destination_icon" />
                                    <p className='font-semibold text-brand-primary'>Select Month {tempMonthFilter?.length > 0 && <span>({tempMonthFilter?.length})</span>}</p>
                                </div>
                                <div className='flex items-center gap-1 basis-2/3 w-[73%]'>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px] h-[30px]`}
                                        onClick={monthScroll.scrollLeft}
                                        disabled={!monthScroll.canScrollLeft}
                                    > 
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" alt="left_arrow" />
                                    </div>
                                    <div ref={monthScroll.scrollRef} className='filterScroll overflow-x-auto'>
                                        <div className='mr-8 flex gap-3 w-max'>
                                            {month && month?.map((val: any) => {
                                                return (
                                                    <div onClick={() => setTempFilterData('month', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempMonthFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                        <p className='text-xs font-semibold'>{val?.split(" ")[0].slice(0, 3) + " " + val?.split(" ")[1].slice(2)}</p>
                                                        {tempMonthFilter.includes(val) && 
                                                            <span className='text-xs font-semibold ml-2 text-brand-primary'>
                                                                <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-cancel-icon-purple.svg" className='w-4' alt="cross_icon" />
                                                            </span>
                                                        }
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px] h-[30px]`}
                                        onClick={monthScroll.scrollRight}
                                        disabled={!monthScroll.canScrollRight}
                                    >
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" className='rotate-180' alt="right_arrow" />
                                    </div>
                                </div>
                            </div>
                            <div className='flex basis-2/5 w-2/5 pl-3 border-l border-gray-400 h-max'>
                                <div className="flex gap-1 text-gray-100 basis-2/5 w-1/3 items-center">
                                    <img className='w-5' src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-nights-icon-purple.svg" alt="destination_icon" />
                                    <p className='font-semibold text-brand-primary'>Select Nights {tempNoOfNightFilter?.length > 0 && <span>({tempNoOfNightFilter?.length})</span>}</p>
                                </div>
                                <div className='flex items-center gap-1 basis-2/5 w-3/5'>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px] h-[30px]`}
                                        onClick={nightsScroll.scrollLeft}
                                        disabled={!nightsScroll.canScrollLeft}
                                    > 
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" alt="left_arrow" />
                                    </div>
                                    <div ref={nightsScroll.scrollRef} className='filterScroll overflow-x-auto '>
                                        <div className='mr-8 flex gap-3 w-max basis-2/3'>
                                            {noOfNight && noOfNight.map((val: any) => {
                                                return (
                                                    <div onClick={() => setTempFilterData('night', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempNoOfNightFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                                        <p className='text-xs font-semibold'>{val}</p>
                                                        {/* {tempNoOfNightFilter.includes(val) && <span className='ml-2 text-brand-primary'>X</span>} */}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div
                                        className={`px-1 inline-flex border border-gray-400 rounded cursor-pointer min-w-[30px] h-[30px]`}
                                        onClick={nightsScroll.scrollRight}
                                        disabled={!nightsScroll.canScrollRight}
                                    >
                                        <img src="http://images.cordeliacruises.com/cordelia_v2/public/assets/new-filter-arrow-icon.svg" className='rotate-180' alt="right_arrow" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='px-4 lg:px-0'>
                        {/* <div className='flex justify-center flex-wrap gap-2 mt-5'>
                            {destinationFilter && destinationFilter.map((val: any) => {
                                return (
                                    <div
                                        className='border lg:border-1 border-brand-primary px-3 lg:px-4 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-semibold text-brand-primary'>
                                        <p>{val}</p>
                                    </div>
                                )
                            })}
                            {startDateFilter && endDateFilter ?
                                <>
                                    <div
                                        className='border lg:border-1 border-brand-primary px-3 lg:px-4 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-semibold text-brand-primary'>
                                        <p>{startDateFilter} - {endDateFilter}</p>
                                    </div>
                                </>
                                : null
                            }
                            {startDateFilter || endDateFilter || destinationFilter.length ?
                                <div
                                    onClick={() => {
                                        setOriginFilter([])
                                        setTempOriginFilter([])
                                        setTripTypeFilter([])
                                        setTempTripTypeFilter([])
                                        setNoOfNightFilter([])
                                        setTempNoOfNightFilter([])
                                        setDestinationFilter([])
                                        setTempDestinationFilter([])
                                        setStartDateFilter(null)
                                        setEndDateFilter(null)
                                        setFilteredItineraryData(itineraryData?.itineraries)
                                    }}
                                    className='flex items-center cursor-pointer border lg:border-1 border-brand-primary px-3 lg:px-4 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-semibold text-brand-primary'>
                                    <p>Clear All</p>
                                    <span className='font-bold ml-2'>X</span>
                                </div>
                                : null
                            }
                        </div> */}

                        <div className='flex justify-between mt-8'>
                            <div>
                                <p className='text-sm lg:text-lg font-semibold'>Cruise Search Results ({filteredItineraryData?.length})</p>
                            </div>
                            {/* Sort & Filter */}
                            <div className='flex gap-6'>
                                <div className='hidden lg:block relative'>
                                    <div onClick={() => {
                                        window.innerWidth > 640 ? setSortByPopover(prev => !prev) : setMainFilter(true);
                                    }} className='flex items-center cursor-pointer'>
                                        <p className='text-base lg:text-lg font-semibold'>Sort By</p>
                                        <img className='h-2.5 lg:h-3.5 ml-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/filter-icon.svg" alt="sort_icon" />
                                    </div>
                                    <div
                                        className={`fixed inset-0 z-10 ${
                                            sortByPopover ? "!bg-opacity-70 visible" : "bg-opacity-0 invisible"
                                        }`}
                                        onClick={() => setSortByPopover(false)}
                                    />
                                    {sortByPopover && <div className='absolute top-10 bg-white z-10 w-max shadow-allSide rounded-md'>
                                        <div
                                            className='p-3 text-sm border-b border-gray-400 cursor-pointer'
                                            onClick={() => handleSortBy("lowest_price")}
                                        >
                                            <p>Price Low To High</p>
                                        </div>
                                        <div
                                            className='p-3 text-sm border-b border-gray-400 cursor-pointer'
                                            onClick={() => handleSortBy("highest_price")}
                                        >
                                            <p>Price High To Low</p>
                                        </div>
                                        <div
                                            className='p-3 text-sm cursor-pointer'
                                            onClick={() => handleSortBy("earliest_departure")}
                                        >
                                            <p>Earliest Date</p>
                                        </div>
                                        {/* <div className='py-3 text-sm'>
                                            <p>Recommended</p>
                                        </div> */}
                                    </div>}
                                </div>
                                <div onClick={() => {
                                    window.innerWidth > 640 ? setMainFilter(true) : setIsOpenNewSortAndFilter(true);
                                }} className='flex items-center cursor-pointer'>
                                    <p className='lg:hidden text-base lg:text-lg font-semibold'>Filter</p>
                                    <p className='hidden lg:block text-base lg:text-lg font-semibold'>Filter By</p>
                                    <img className='h-5 lg:h-6 ml-2' src="http://images.cordeliacruises.com/cordelia_v2/public/assets/filter-new-design-icon.svg" alt="filter_icon" />
                                </div>
                            </div>
                        </div>

                        <div className='mt-10 lg:mt-4'>
                            {filteredItineraryData && filteredItineraryData.map((val: any, i: any) => (
                                <ItineraryCard data={val} callBack={onLogin} />
                            ))}
                        </div>
                        {itinerarySelector ?
                            <div className='text-center'>
                                <button
                                    className='text-brand-primary border-1 border-brand-primary px-6 text-sm font-semibold py-2 rounded'
                                    onClick={() => {
                                        navigate('/upcoming-cruises')
                                        // setFilteredItineraryData(itineraryData?.itineraries)
                                        window.location.reload();
                                    }}
                                >
                                    View All Itineraries
                                </button>
                            </div>
                            : null}
                    </div>
                </div>
            </div>

            {isOpenNewFilters && <NewFiltersBottomSheet />}
            {isOpenNewSortAndFilter && <NewSortAndFilterBottomSheet />}

            {/* <LoginModal show={showLoginModal} handleClose={() => setShowLoginModal(false)} selectedItinerary={selectedItinerary} /> */}
            <ProfileAuth setAuthModal={setShowLoginModal} token={token} setToken={setToken} authModal={showLoginModal} type='reveal' selectedItinerary={selectedItinerary} />


            <Modal show={mainFilter} align={'center'} className="max-h-[70%] overflow-y-scroll no-scrollbar drop-shadow bg-white w-[90%] lg:w-[40%] center bottom-1/4 rounded-lg lg:rounded border overflow-hidden left-0 right-0 m-auto" onClose={() => {
                setMainFilter(false)
                setTempTripTypeFilter([...tripTypeFilter])
                setTempOriginFilter([...originFilter])
                setTempNoOfNightFilter([...noOfNightFilter])
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
                        <div className='flex mt-2'>
                            {tripType && tripType.map((val: any) => {
                                let name = null;
                                let icon = null;
                                let activeIcon = null;
                                if (val == 'round') {
                                    name = 'Round Trip'
                                    icon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-black-icon.svg'
                                    activeIcon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-purple-icon.svg'
                                } else if (val == 'one_way') {
                                    name = 'One Way Trip'
                                    icon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-black-icon.svg'
                                    activeIcon = 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-purple-icon.svg'
                                }
                                return (
                                    <div onClick={() => setTempFilterData('trip', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded mr-2 border ${tempTripTypeFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                        <img className='mr-2' src={`${tempTripTypeFilter.includes(val) ? activeIcon : icon}`} alt="" />
                                        <p className='text-xxs lg:text-sm font-normal'>{name}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {/* <div className='mt-5'>
                        <p className='font-semibold'>Number of Nights</p>
                        <div className='flex flex-wrap gap-2 mt-2'>
                            {noOfNight && noOfNight.map((val: any) => {
                                return (
                                    <div onClick={() => setTempFilterData('night', val)} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempNoOfNightFilter.includes(val) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                        <p className='text-xxs lg:text-sm font-normal'>{val} Nights</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div> */}
                    <div className='mt-5'>
                        <p className='font-semibold'>Departure Port</p>
                        <div className='flex flex-wrap gap-2 mt-2'>
                            {origin && origin.map((val: any, i: number) => {
                                return (
                                    <div onClick={() => setTempFilterData('origin', val.name)} key={i} className={`flex items-center cursor-pointer px-5 py-1.5 rounded border ${tempOriginFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'}`}>
                                        <p className='text-xxs lg:text-sm font-normal'>{val.name}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className='border-t border-gray-300 my-4 w-full' />
                    <div className='flex justify-center gap-4'>
                        <div className='mt-3 w-[150px]'>
                            <button
                                onClick={() => {
                                    ResetFilter()
                                }}
                                className='bg-gray-300 py-3 rounded w-full'
                            >
                                Reset All
                            </button>
                        </div>
                        <div className='mt-3 w-[150px]'>
                            <button
                                onClick={() => {
                                    handleFilterItinerary('click')
                                    setMainFilter(false)
                                }}
                                className='bg-brand-primary py-3 rounded text-white w-full'
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal show={dateFilter} align={'center'} className="max-h-[90%] overflow-y-scroll no-scrollbar drop-shadow w-[90%] lg:w-2/4 center bottom-1/4 overflow-hidden left-0 right-0 m-auto" onClose={() => {
                setDateFilter(false)
                setTempDestinationFilter([...destinationFilter])
            }}>
                <div className='overflow-scroll no-scrollbar h-[99%]'>
                    <div className='justify-center hidden lg:flex'>
                        <div className='w-[300px] bg-white border rounded-l border-gray-400 shadow-allSide px-8 py-3.5 text-gray-100 text-lg font-medium flex items-center justify-between'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/destination-upcoming-icon.svg" alt="" />
                                <p>Destinations</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div>
                        <div className='w-[300px] bg-white border rounded-r border-gray-400 shadow-allSide px-8 py-3.5 text-gray-100 text-lg font-medium flex items-center justify-between'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/calendar-upcoming-icon.svg" alt="" />
                                <p>Dates</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div>
                        {/* <div onClick={() => setDateFilter(true)} className='w-[300px] border border-gray-400 shadow-allSide px-4 lg:px-8 py-4 cursor-pointer flex items-center justify-between text-gray-100 text-sm lg:text-lg font-medium'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/destination-upcoming-icon.svg" alt="" />
                                <p>Destinations</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div>
                        <div onClick={() => setDateFilter(true)} className='w-[300px] border border-gray-400 shadow-allSide px-4 lg:px-8 py-4 cursor-pointer flex items-center justify-between text-gray-100 text-sm lg:text-lg font-medium'>
                            <div className='flex items-center'>
                                <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/calendar-upcoming-icon.svg" alt="" />
                                <p>Dates</p>
                            </div>
                            <img className='h-4 lg:h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-arow-booking-icon.svg" alt="" />
                        </div> */}
                    </div>
                    <div className='bg-white mt-4 h-[85%] rounded'>
                        <div className='grid grid-cols-1 lg:grid-cols-2 px-4 lg:px-6 py-6'>
                            <div>
                                <p className='font-semibold'>Select Destination</p>
                                <div className='flex flex-wrap mt-3'>
                                    {portsList && portsList.map((val: any, i: number) => {
                                        return (
                                            <div onClick={() => setTempFilterData('destination', val.name)} key={i} className={`text-xxs cursor-pointer font-medium px-3 lg:px-5 py-1.5 mr-3 mb-3 rounded lg:text-sm border ${tempDestinationFilter.includes(val.name) ? 'border-brand-primary text-brand-primary' : 'bg-gray-100/5 border-gray-100/5 text-black'} `}>
                                                <p className='text-xs lg:text-sm'>{val.name}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className='calendar-box lg:pl-10'>
                                <div className='flex justify-between items-center'>
                                    <p className='font-semibold'>Select Sailing Dates</p>
                                    <div className='flex items-center'>
                                        <div className='w-[17px] h-[17px] rounded-full bg-[#fde1da]' />
                                        <p className='font-normal text-sm ml-1.5'>Sailing Date</p>
                                    </div>
                                </div>
                                <Calendar datesToHighlight={datesToHighlight} setDateFilter={DateFilter} selectedStartDate={startDateFilter} selectedEndDate={endDateFilter} />
                            </div>
                        </div>
                        <div className='w-full px-4 pb-6'>
                            <button
                                onClick={() => {
                                    handleFilterItinerary('click')
                                    setDateFilter(false)
                                }}
                                className='bg-brand-primary py-3 rounded text-white w-full'
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
