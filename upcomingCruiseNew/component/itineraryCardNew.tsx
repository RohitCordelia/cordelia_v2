import React, { useEffect, useState } from 'react'
import moment, { max } from 'moment';
import { SaveStore, GetAuth, GetAB, SaveManageDetail, GetManageDetail } from '../../../utils/store/store';
import { FormatAmount } from '../../../../src/utils/formatter/formatter';
import Button from '../../../components/UI/Button';
import { ANALYTICS_EVENTS, trackCustomEvent } from '../../../services/analytics';
import routeId from './routeIds.json';
import BottomSheet from '../../../component/BottomSheet';
import Modal from '../../../components/UI/ModalCenter';
import Table from '../../../components/Table';
import BpgModel from '../../../components/bpgModel';
import EMICard from '../../../component/EMICard';
import BpgContent from '../../../pages/bpg/component/BpgContent';
import { Player } from '@lottiefiles/react-lottie-player';
import bpg from '../../../utils/lottie/bpg.json';
import '../index.css';

type Props = {}

const firstTenItems = [200, 180, 165, 145, 120, 111, 95, 81, 65, 45];

export const generateViewingCount = (index: number): number => {
    if (index <= 9) {
        const hour = new Date().getHours();
        let multiplier = 1;
        if (hour >= 12 && hour < 18) multiplier = 2;
        else if (hour >= 18) multiplier = 3;
        return Math.round(firstTenItems[index] * multiplier + Math.random() * 40);
    }
    return 0;
};

export default function ItineraryCardNew({ type = "upcoming", data, index, callback, showFreeCancellationStripe }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [views, setViews] = useState(0);
    const [open, setOpen] = useState(false);
    const [openFreeCancellation, setOpenFreeCancellation] = useState(false);
    const [showRevealPriceCTA, setShowRevealPriceCTA] = useState(false);
    const [token, setToken] = useState(null);
    const authToken = GetAuth()?.token;
    const [isBpgOpen, setIsBpgOpen] = useState(false);


    useEffect(() => {
        setViews(generateViewingCount(index));
    }, [index]);

    useEffect(() => {
        setToken(authToken);
    }, [authToken]);

    useEffect(() => {
        const handler = () => {
            const saved = GetAuth();
            setToken(saved?.token ? saved?.token : null);
        };
        window.addEventListener("authChanged", handler);
        return () => window.removeEventListener("authChanged", handler);
    }, []);

    useEffect(() => {
        if (routeId.includes(data?.route_id) && !token) {
            setShowRevealPriceCTA(true);
        } else {
            setShowRevealPriceCTA(false);
        }
    }, [data?.route_id, token]);

    const itineraryName =
        data?.nights > 3
            ? `${data?.ports[0]?.name} - ${data?.ports[data?.ports.length - 1]?.name}`
            : data?.ports?.map((p: any) => p.name).join(' - ');

    const portList = data?.ports
        .filter((val: any) => val.name !== 'At Sea')
        .map((val: any) => val.name)
        .join(' • ');
    const isLong = portList.length > 40;

    const emiTotalAmount = data?.per_guest_per_night;
    const emiAmount = FormatAmount(Math.round(emiTotalAmount / 9));

    const BookNow = (itinerary_id: any) => {
        SaveStore({ itinerary: data });
        trackCustomEvent(ANALYTICS_EVENTS.BOOK_NOW_CLICKED, {
            visiting_ports: portList,
            destination_name: data?.destination_port?.name,
            no_of_nights: data?.nights,
            trip_type: data?.trip_type === "round" ? "Round Trip" : "One Way Trip",
            price_starting_from: data?.starting_fare,
            trip_start_date: data?.start_date,
            trip_end_date: data?.end_date,
            offers_available: data?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
            itinerary_name: itineraryName || data?.alias || "",
            page_url: window.location.href,
        });

        window.open('/upcoming-cruises/selectcabin?id=' + itinerary_id, '_blank')
    }


    const ViewItinerary = (itinerary_id: any) => {
        SaveStore({ itinerary: data });
        window.open(`/upcoming-cruises/itinerary?id=${itinerary_id}${type === "reschedule" ? `&action=${type}` : ""}`, '_blank')
    }

    const TagList = ({ tags = [] }) => {
        const limitedTags = tags.slice(0, 3);

        const bgColors = ["#FFE8FE", "#E4F0FF", "#ECFFF5"];
        const textColors = ["#92278F", "#0066CC", "#1A8E3B"];

        return (
            <div className="flex flex-wrap gap-1 max-w-full">
                {limitedTags.map((tag, index) => (
                    <div
                        key={index}
                        className="rounded-full px-3 py-[2px] whitespace-nowrap"
                        style={{
                            backgroundColor: bgColors[index % bgColors.length],
                            color: textColors[index % textColors.length]
                        }}
                    >
                        <p className="text-[8.3px] font-bold">{tag}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="grid grid-cols-10 mb-6 shadow-bottom lg:shadow-allSide rounded-lg overflow-hidden bg-white">
                <div className='col-span-10 lg:col-span-3 relative aspect-[1.58] lg:aspect-auto'>
                    <img className='h-full w-[90%] overflow-hidden rounded-md lg:rounded-none lg:rounded-l mx-auto lg:w-full' src={window.innerWidth > 786 ? data?.image_url : data?.image_url_mobile || data?.image_url} alt="" />
                    <div className='absolute top-0 left-0 right-0 bottom-0'>
                        <div className='px-8 lg:px-4 py-4 flex flex-col justify-between items-start w-full h-full'>
                            {/* <Button size='xs' text={data?.ship?.name} className='rounded-full !py-[1px] !px-4 text-xxs opacity-80' /> */}
                            <div
                                className='rounded-full px-3 py-1 flex items-center gap-1'
                                style={{
                                    border: 'double 2px transparent',
                                    backgroundImage: 'linear-gradient(99.72deg, rgb(146 39 143 / 80%) -17.25%, rgb(234 114 91 / 80%) 105.93%)',
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: 'padding-box, border-box',
                                }}
                            >
                                <img className='h-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cruise-itinerary-tag-white-icon.svg" alt="" />
                                <p className='text-[9px] font-semibold text-white uppercase'>{data?.ship?.name}</p>
                            </div>
                            <TagList tags={data?.tags} />
                        </div>
                    </div>
                    {views > 0 &&
                      <div className='text-right absolute top-4 right-[5%] lg:right-0'>
                        <div className='bg-brand-green text-white inline-block rounded-l-full px-3 lg:px-4 py-1 lg:py-1.5'>
                          <div className='flex items-center gap-1'>
                            <img className='h-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/viewing-icon-white.svg" alt="" />
                            <p className='text-xxxs lg:text-xxs font-bold leading-none'>{views} Viewing</p>
                          </div>
                        </div>
                      </div>
                    }
                </div>
                <div className='col-span-10 lg:col-span-7 grid grid-cols-12 relative'>
                    <div className='lg:hidden col-span-12 lg:col-span-8 px-4 py-2 lg:py-6 flex justify-between items-center gap-3'>
                      <div className='flex flex-col gap-3'>
                        <p className={`text-[0.85rem] lg:text-[1.20rem] leading-6 font-bold lg:font-semibold basis-3/4`}>
                            {data?.alias || itineraryName}
                            {/* <span className="ml-1 text-[0.85rem] lg:text-[1.15rem] leading-9 font-bold lg:font-semibold">
                                ({data?.nights}N/{data?.nights + 1}D)
                            </span> */}
                        </p>
                        <div className='flex items-center gap-2'>
                            <div className='flex gap-1 items-center'>
                                <p className='text-xs lg:text-[13px] text-gray-100'>{moment(data.start_date, 'DD/MM/YYYY').format("MMM DD, YYYY")}</p>
                                <img
                                    className='h-4 lg:h-5'
                                    src="https://images.cordeliacruises.com/cordelia_v2/public/assets/date_arrow.svg"
                                    alt="backIcon"
                                />
                                <p className='text-xs lg:text-[13px] text-gray-100'>{moment(data.end_date, 'DD/MM/YYYY').format("MMM DD, YYYY")}</p>
                            </div>
                        </div>
                      </div>
                      <div className='cursor-pointer' onClick={() => setIsBpgOpen(true)}>
                        <Player
                          src={bpg}
                          style={{ width: 70, height: 60 }}
                          loop
                          autoplay
                        />
                      </div>
                    </div>
                    <div className='col-span-12 lg:col-span-8 px-4 py-2 lg:py-6 relative lg:min-h-[288px]'>
                        <div className='hidden lg:flex justify-between gap-3'>
                            <div className='flex flex-col gap-2'>
                            <p className={`hidden lg:block text-[0.85rem] lg:text-[1.20rem] leading-6 font-bold lg:font-semibold`}>
                                {data?.alias || itineraryName}
                            </p>
                            <div className='hidden lg:flex items-center gap-2'>
                                <div className='hidden lg:flex gap-1 items-center'>
                                    <p className='text-xs lg:text-[13px] text-gray-100'>{moment(data.start_date, 'DD/MM/YYYY').format("MMM DD, YYYY")}</p>
                                    <img
                                        className='h-4 lg:h-5'
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/date_arrow.svg"
                                        alt="backIcon"
                                    />
                                    <p className='text-xs lg:text-[13px] text-gray-100'>{moment(data.end_date, 'DD/MM/YYYY').format("MMM DD, YYYY")}</p>
                                </div>
                            </div>
                            </div>
                            <div className='cursor-pointer hidden lg:block' onClick={() => setIsBpgOpen(true)}>
                            <Player
                                src={bpg}
                                style={{ width: 70, height: 60 }}
                                loop
                                autoplay
                            />
                            </div>
                        </div>
                        <div className='border-b mb-2 lg:my-3 border-gray-300' />
                        <div className="">
                            <span
                                className={`text-xs lg:text-xs font-bold !leading-5 mr-1`}
                            >
                                Ports:
                            </span>
                            <span className="text-xs lg:text-xs font-medium !leading-5">
                                {isLong && !isExpanded ? portList?.slice(0, 40) + '...' : portList}
                            </span>
                            {isLong && (
                                <span
                                    onClick={() => setIsExpanded(prev => !prev)}
                                    className="text-xs lg:text-xs text-brand-primary font-bold ml-2 cursor-pointer inline-block"
                                >
                                    {isExpanded ? 'View less' : 'View more'}
                                </span>
                            )}
                        </div>
                        <div className='border-b my-2 lg:my-3 border-gray-300' />

                        <div className='hidden lg:block'>
                            {Array.isArray(data?.offers_available) ?
                                <div>
                                    <p className='text-xxs lg:text-[11px] text-[#2274E0] font-semibold mb-2'>Available Offers</p>
                                    <div className='grid grid-cols-2 gap-2'>
                                        {data.offers_available.slice(0, 4).map((val: any, i: any) => {
                                            if (typeof val === 'string') {
                                                return (
                                                    <div className='flex items-center' key={i}>
                                                        <img className='mr-2 h-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-upcoming-icon.svg" alt="" />
                                                        <p className='text-xs lg:text-xs font-semibold'>{val}</p>
                                                    </div>
                                                )
                                            }
                                            if (val && typeof val === 'object') {
                                                return (
                                                    <div className='flex items-center' key={i}>
                                                        <img className='mr-2 h-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-upcoming-icon.svg" alt="" />
                                                        <p className='text-xs lg:text-xs font-semibold'>{val.offer}</p>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                </div>
                                : null
                            }
                        </div>

                        <div className="col-span-12 mt-4 flex absolute bottom-0 left-0 w-full">
                            {/* Best Price Guarantee */}
                            <div
                                className={`${
                                showFreeCancellationStripe ? 'col-span-6' : 'col-span-12 basis-full'
                                } hidden lg:flex justify-center items-center basis-1/2 gap-2 py-2 bg-brand-green/10 cursor-pointer border-l-[3px] border-brand-green`}
                                onClick={() => setIsBpgOpen(true)}
                            >
                                <img src='https://images.cordeliacruises.com/cordelia_v2/public/assets/BPG-logo-icon.svg' alt="" className='w-4 h-4' />
                                <p className="uppercase text-[8px] lg:text-xxs font-bold">
                                    Best Price Guarantee
                                </p>
                                <div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
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
                                </div>
                            </div>

                            {/* Risk-Free Cancellation */}
                            {showFreeCancellationStripe && (
                                <div
                                    className="col-span-6 hidden lg:flex justify-center items-center basis-1/2 gap-2 py-2.5 bg-brand-blue/10 cursor-pointer border-l-[3px] border-textBlue"
                                    onClick={() => setOpenFreeCancellation(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="13" viewBox="0 0 14 13" fill="none">
                                        <path d="M13.3765 0.178893C13.1293 0.0185709 12.8286 -0.0370017 12.5404 0.0243968C12.2522 0.0857954 12.0002 0.259137 11.8399 0.5063L5.61394 10.103L1.86515 7.35494C1.75803 7.25589 1.63244 7.17891 1.49557 7.12839C1.35869 7.07788 1.2132 7.05482 1.06742 7.06053C0.772985 7.07206 0.495192 7.20008 0.29515 7.41642C0.0951079 7.63277 -0.010797 7.91972 0.000732999 8.21416C0.012263 8.50859 0.140283 8.78638 0.356631 8.98642L5.05579 12.613C5.05579 12.613 5.17024 12.7115 5.2232 12.7459C5.34561 12.8254 5.48248 12.8799 5.62598 12.9065C5.76948 12.933 5.91681 12.931 6.05954 12.9006C6.20227 12.8702 6.33761 12.812 6.45784 12.7293C6.57807 12.6465 6.68082 12.541 6.76024 12.4185L13.7039 1.71556C13.8643 1.46836 13.9198 1.1676 13.8584 0.879429C13.797 0.591259 13.6237 0.339274 13.3765 0.178893Z" fill="#2274E0"/>
                                    </svg>
                                    <p className="uppercase text-[8px] lg:text-xxs font-bold">
                                        Free Cancellation
                                    </p>
                                    <div>
                                        <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='col-span-5 lg:hidden px-4'>
                        {Array.isArray(data?.offers_available) ?
                            <div>
                                <p className='text-xxs lg:text-xs text-brand-blue font-bold mb-2'>Available Offers</p>
                                {data.offers_available.slice(0, 4).map((val: any, i: any) => {
                                    if (typeof val === 'string') {
                                        return (
                                            <div className='flex items-center mb-1' key={i}>
                                                <img className='mr-2 h-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-upcoming-icon.svg" alt="" />
                                                <p className='text-xs lg:text-xs font-semibold text-brand-green'>{val}</p>
                                            </div>
                                        )
                                    }
                                    if (val && typeof val === 'object') {
                                        return (
                                            <div className='flex items-center mb-1' key={i}>
                                                <img className='mr-2 h-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-upcoming-icon.svg" alt="" />
                                                <p className='text-xs lg:text-xs font-semibold text-brand-green'>{val.offer}</p>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                            : null
                        }
                    </div>
                    <div className={`col-span-7 lg:col-span-4 lg:border-l lg:py-3 border-gray-300 flex flex-col justify-center`}>
                        <div className={`pl-0 pr-4 lg:px-3 text-right lg:text-center ${showRevealPriceCTA ? 'mb-6 flex items-center justify-center flex-1' : ''}`}>
                            {!showRevealPriceCTA && <div className="flex flex-col items-end lg:items-center gap-1">
                                {token &&
                                    <>
                                        <p className="text-xxs lg:text-xxs text-gray-100 font-normal">Starting From</p>
                                        <div className='flex justify-center items-baseline gap-2'>
                                            {data?.discount_pct != 0 ?
                                                <span className="text-xs line-through text-gray-100">{`₹${FormatAmount(data?.actual_per_guest_per_night)}`}</span>
                                                : null}
                                            <p className={`text-sm lg:text-lg lg:leading-4 ${showRevealPriceCTA ? 'font-bold' : 'font-medium'}`}>{`₹${FormatAmount(data?.per_guest_per_night)}`}</p>
                                        </div>
                                        <p className="text-xxs lg:text-xxs mb-0 font-normal text-gray-100">Excl. GST PP in Double Occupancy</p>
                                    </>
                                }
                                {!showRevealPriceCTA && <div onClick={() => setOpen(true)} className="mt-1 p-2 rounded-md bg-gray-400/60 w-max cursor-pointer">
                                    <p className="text-xxs lg:text-xs font-medium flex justify-center items-center lg:justify-start gap-1">No-Cost EMI starts at</p>
                                    <p className="inline-flex items-center gap-1 w-full justify-center text-base lg:text-2xl text-brand-primary font-bold whitespace-nowrap">
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
                            {window.innerWidth < 768 
                                ? <BottomSheet
                                    isOpen={isBpgOpen}
                                    setIsOpen={setIsBpgOpen}
                                    onClose={() => setIsBpgOpen(false)}
                                    hasBtns={false}
                                    contentClassName= {`!pr-0`}
                                    className='!p-0'
                                >

                                    <BpgContent onClose={() => setIsBpgOpen(false)} />
                                </BottomSheet>
                                : <BpgModel
                                    isOpen={isBpgOpen}
                                    onClose={() => setIsBpgOpen(false)}
                                />
                            }
                            <div className="mt-3 hidden lg:block pb-2">
                                <Button
                                    className='w-full rounded-full !py-1.5'
                                    text={showRevealPriceCTA ? "Reveal Price" : "Book Now"}
                                    size="sm"
                                    type="primary"
                                    handleClick={() => showRevealPriceCTA ? callback() : BookNow(data.itinerary_id)}
                                />
                                <Button
                                    className='w-full rounded-full !py-1.5 !border-1 mt-2'
                                    text="View Itinerary"
                                    size="sm"
                                    type='secondary'
                                    handleClick={() => ViewItinerary(data.itinerary_id)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 mt-4 flex lg:hidden px-4">
                      {/* Best Price Guarantee */}
                      <div
                        className={`${
                          showFreeCancellationStripe ? 'col-span-6' : 'col-span-12 basis-full'
                        } lg:hidden flex justify-center items-center basis-1/2 gap-2 py-1.5 bg-brand-green/10 cursor-pointer border-l-2 border-brand-green`}
                        onClick={() => setIsBpgOpen(true)}
                      >
                        <img src='https://images.cordeliacruises.com/cordelia_v2/public/assets/BPG-logo-icon.svg' alt="" className='w-4 h-4' />
                        <p className="uppercase text-[8px] font-bold">
                          Best Price Guarantee
                        </p>
                        <div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
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
                        </div>
                      </div>

                      {/* Risk-Free Cancellation */}
                      {showFreeCancellationStripe && (
                        <div
                          className="col-span-6 lg:hidden flex justify-center items-center basis-1/2 gap-2 py-2.5 bg-brand-blue/10 cursor-pointer border-l-2 border-textBlue"
                          onClick={() => setOpenFreeCancellation(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="13" viewBox="0 0 14 13" fill="none">
                            <path d="M13.3765 0.178893C13.1293 0.0185709 12.8286 -0.0370017 12.5404 0.0243968C12.2522 0.0857954 12.0002 0.259137 11.8399 0.5063L5.61394 10.103L1.86515 7.35494C1.75803 7.25589 1.63244 7.17891 1.49557 7.12839C1.35869 7.07788 1.2132 7.05482 1.06742 7.06053C0.772985 7.07206 0.495192 7.20008 0.29515 7.41642C0.0951079 7.63277 -0.010797 7.91972 0.000732999 8.21416C0.012263 8.50859 0.140283 8.78638 0.356631 8.98642L5.05579 12.613C5.05579 12.613 5.17024 12.7115 5.2232 12.7459C5.34561 12.8254 5.48248 12.8799 5.62598 12.9065C5.76948 12.933 5.91681 12.931 6.05954 12.9006C6.20227 12.8702 6.33761 12.812 6.45784 12.7293C6.57807 12.6465 6.68082 12.541 6.76024 12.4185L13.7039 1.71556C13.8643 1.46836 13.9198 1.1676 13.8584 0.879429C13.797 0.591259 13.6237 0.339274 13.3765 0.178893Z" fill="#2274E0"/>
                          </svg>
                          <p className="uppercase text-[8px] font-bold">
                            Free Cancellation
                          </p>
                          <div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
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
                          </div>
                        </div>
                      )}

                    </div>
                    <div className="col-span-12 lg:hidden pb-4 px-4">
                        <div className='border-b my-3 border-gray-300' />
                        <div className='flex gap-4'>
                            <Button
                                className='w-full rounded-full !py-2'
                                text={showRevealPriceCTA ? "Reveal Price" : "Book Now"}
                                size="sm"
                                type="primary"
                                handleClick={() => showRevealPriceCTA ? callback() : BookNow(data.itinerary_id)}
                            />
                            <Button
                                className='w-full rounded-full !py-2'
                                text="View Itinerary"
                                size="sm"
                                type='secondary'
                                handleClick={() => ViewItinerary(data.itinerary_id)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {window.innerWidth < 768 ? <BottomSheet isOpen={openFreeCancellation} setIsOpen={setOpenFreeCancellation} title="Cancellation Details" onClose={() => setOpenFreeCancellation(false)} hasBtns={false} >
                <div className="py-4">
                    <ul className="list-disc pl-4">
                        <li className='text-xs text-gray-200 mb-1'>This cancellation policy shall apply only upon receipt of full payment for the booking.</li>
                    </ul>
                    <Table
                        headers={["Days to Departure", "Cancellation Policy"]}
                        data={[
                            ["46+ Days", "100% Refund"],
                            ["45-31 Days", "90% Refund on Cabin Fare + 100% Refund on Service Charges & Levies"],
                            ["30-7 Days", "80% Refund on Cabin Fare + 100% Refund on Service Charges & Levies"],
                            ["Within 7 Days", "Non-Refundable"],
                            ["No Show", "100% Refund on Service Charges & Levies"]
                        ]}
                    />
                </div>
            </BottomSheet> :
                <Modal
                    show={openFreeCancellation}
                    align={'center'}
                    className="drop-shadow bg-white w-full lg:w-2/6 center  lg:top-1/5 bottom-0 lg:bottom-1/6 lg:left-1/3 left-4 lg:h-auto rounded-none lg:rounded-lg border"
                    mainClassName="!px-0 !items-end lg:!items-center"
                    onClose={() => {
                        setOpenFreeCancellation(false);
                    }}
                >
                    <div className='border-b border-gray-300 p-4 flex items-center justify-between'>
                        <div className='w-full'>
                            <h1 className='text-xl font-bold font-inter'>Cancellation Details</h1>
                        </div>
                        <svg
                            onClick={() => {
                                setOpenFreeCancellation(false);
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
                    <div className="p-4">
                        <ul className="list-disc pl-4">
                            <li className='text-xs text-gray-200 mb-1'>This cancellation policy shall apply only upon receipt of full payment for the booking.</li>
                        </ul>
                        <Table
                            headers={["Days to Departure", "Cancellation Policy"]}
                            data={[
                                ["46+ Days", "100% Refund"],
                                ["45-31 Days", "90% Refund on Cabin Fare + 100% Refund on Service Charges & Levies"],
                                ["30-7 Days", "80% Refund on Cabin Fare + 100% Refund on Service Charges & Levies"],
                                ["Within 7 Days", "Non-Refundable"],
                                ["No Show", "100% Refund on Service Charges & Levies"]
                            ]}
                        />
                    </div>
                </Modal>}

        {window.innerWidth < 768 ? <BottomSheet isOpen={open} setIsOpen={setOpen} title="No-Cost EMI Details" onClose={() => setOpen(false)} hasBtns={false} >
            <EMICard emiTotalAmount={Math.round(emiTotalAmount)} />
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
            <EMICard emiTotalAmount={Math.round(emiTotalAmount)} />
        </Modal>}
        </>
    );
}