import React, { useEffect, useState } from 'react'
import moment from 'moment';
import Tooltip from '../../../components/UI/Tooltip/ShoreEx';
import { SaveStore, GetAuth, GetAB, SaveManageDetail, GetManageDetail } from '../../../utils/store/store';
import { FormatAmount } from '../../../../src/utils/formatter/formatter';
import DateComponent from '../../myBooking/component/DateComponent';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/UI/Button';
import { ANALYTICS_EVENTS, trackCustomEvent } from '../../../services/analytics';
type Props = {}

export default function ItineraryCard({ type = "upcoming", data, callBack }: any) {
    // const AUTH = GetAuth();
    // const ab = GetAB();
    const navigate = useNavigate();
    const ManageDetail = GetManageDetail();

    const [showPrice, setShowPrice] = useState<boolean>(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const itineraryName =
        data?.nights > 5
            ? `${data?.ports[0]?.name} - ${data?.ports[data?.ports.length - 1]?.name}`
            : data?.ports.map((p: any) => p.name).join(' - ');

    const portList = data?.ports
        .filter((val: any) => val.name !== 'At Sea')
        .map((val: any) => val.name)
        .join(' | ');
    const isLong = portList.length > 150;

    useEffect(() => {
        const checkAuth = () => {
            const AUTH = GetAuth();
            const ab = GetAB();

            if (AUTH && AUTH.token && AUTH.exp > Math.round(+new Date() / 1000)) {
                setShowPrice(true);
            } else {
                setShowPrice(ab !== 1);
            }
        };

        checkAuth(); // Run initially

        // Listen for custom "authChanged" event
        window.addEventListener("authChanged", checkAuth);

        return () => {
            window.removeEventListener("authChanged", checkAuth);
        };
    }, []);

    const BookNow = (itinerary_id: any) => {
        SaveStore({ itinerary: data });
        // navigate('/upcoming-cruises/selectCabin?id=' + itinerary_id)
        trackCustomEvent(ANALYTICS_EVENTS.BOOK_NOW_CLICKED, {
            visiting_ports: portList,
            destination_name: data?.destination_port?.name,
            no_of_nights: data?.nights,
            trip_type: data?.trip_type === "round" ? "Round Trip" : "One Way Trip",
            price_starting_from: data?.starting_fare,
            trip_start_date: data?.start_date,
            trip_end_date: data?.end_date,
            offers_available: data?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
            itinerary_name: itineraryName,
            page_url: window.location.href,
        });
        window.open('/upcoming-cruises/selectCabin?id=' + itinerary_id, '_blank')
    }
    const ViewItinerary = (itinerary_id: any) => {
        SaveStore({ itinerary: data });
        window.open(`/upcoming-cruises/itinerary?id=${itinerary_id}${type === "reschedule" ? `&action=${type}` : ""}`, '_blank')
        // navigate('/upcoming-cruises/itinerary?id=' + itinerary_id)
    }

    const rescheduleItinerary = (data: any) => {
        SaveManageDetail({
            ...ManageDetail,
            rescheduleBooking: data
        });
        SaveStore({ itinerary: data });
        navigate("/manage-booking/reschedule/select-cabin", { state: { rescheduleData: data, portList, itineraryName } });
    }

    const TagDesign = (tag: any) => {
        if (tag == 'Flash Sale') {
            return (
                <div className='relative'>
                    <p className='absolute top-[3px] lg:top-[6px] text-xxs lg:text-xs font-bold italic text-white left-[23px] lg:left-[33px]'>Flash Sale</p>
                    <img className='w-[90px] lg:w-[120px]' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/flash-selling-tag.svg' alt="" />
                </div>
            )
        } else if (tag == 'Lowest Price') {
            return (
                <div className='relative'>
                    <p className='absolute top-[3px] lg:top-[6px] text-xxs lg:text-xs font-bold italic text-white left-[14px] lg:left-[26px]'>Lowest Price</p>
                    <img className='w-[90px] lg:w-[120px]' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/best-price-tag.svg' alt="" />
                </div>
            )
        } else if (tag == 'Fast Selling') {
            return (
                <div className='relative'>
                    <p className='absolute top-[3px] lg:top-[6px] text-xxs lg:text-xs font-bold italic text-white left-[18px] lg:left-[31px]'>Fast Selling</p>
                    <img className='w-[90px] lg:w-[120px]' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/fast-selling-tag.svg' alt="" />
                </div>
            )
        }
    }

    const filteredPorts = [...new Set(data?.ports.map((val: any) => val.name))]
        .filter((name) => name !== "At Sea");

    const shipName = data?.ship?.name?.toLowerCase();

    return (
        <div className="grid grid-cols-10 mb-10 relative">
            <div className='col-span-10 lg:col-span-2 h-[70px]'>
                <div className='absolute left-1/2 lg:left-0 -translate-x-1/2 -translate-y-[10%] lg:-translate-y-0 lg:-translate-x-0 top-0 lg:top-6 w-[95%] lg:w-auto rounded-lg overflow-hidden'>
                    <div className='relative z-10'>
                        <img className='w-[435px] h-[190px] lg:h-[310px] rounded-t-lg' src={data?.start_date === "13/06/2025" ? "https://images.cordeliacruises.com/cordelia_v2/public/images/Find_a_cruise_642X414.webp" : data?.image_url} alt="" />
                        <div className='absolute bottom-0 left-0 right-0 flex mb-4'>
                            <div className='bg-white rounded-r-full'>
                                <div className='col-span-3 relative flex'>
                                    {data?.nights > 2 && data?.start_date !== "13/06/2025" ?
                                        <Tooltip text="A shore excursion is a group tour or activity aimed at cruise travelers who can spend time in each port they're visiting on their itinerary. <br/> All shore excursions are available at an additional cost.">
                                            <div className='px-4 lg:px-6 w-fit py-1.5 rounded-r-full cursor-pointer bg-brand-blue/20 flex items-center'>
                                                <p className='text-xxs lg:text-sm text-brand-blue font-semibold'>Shore Excursions Available</p>
                                                <img className='h-5 ml-1 lg:ml-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/shoreex-info-icon.svg" alt="" />
                                            </div>
                                        </Tooltip>
                                        : null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='col-span-10 lg:col-span-8 shadow-allSide pt-24 lg:pt-6 py-4 min-h-[360px] rounded-md bg-white'>
                <div className='flex justify-between items-start gap-3 text-brand-primary m-4 lg:my-4 lg:pl-60 lg:mx-0 lg:mr-0 lg:mb-6'>
                    <div className='flex gap-2 lg:gap-3 items-center justify-between lg:justify-start w-full lg:w-auto'>
                        <div className='flex gap-1.5 justify-between'>
                            <p className='text-xs lg:text-base font-bold'>{moment(data.start_date, 'DD/MM/YYYY').format('DD MMM YYYY')}</p>
                            <img
                                className='h-4 lg:h-6'
                                src="https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-purple-icon.svg"
                                alt="backIcon"
                            />
                            <p className='text-xs lg:text-base font-bold'>{moment(data.end_date, 'DD/MM/YYYY').format('DD MMM YYYY')}</p>
                        </div>
                        <p className='hidden lg:block text-black font-bold'>|</p>
                        <div className='flex items-center basis-[38%] lg:basis-auto justify-end'>
                            <img className='h-4 lg:h-6 mt-[2px]' src={`${data?.trip_type == "round" ? 'https://images.cordeliacruises.com/cordelia_v2/public/assets/roundtrip-purple-icon.svg' : 'https://images.cordeliacruises.com/cordelia_v2/public/assets/oneway-purple-icon.svg'}`} alt="" />
                            <p className='text-xxs lg:text-sm ml-2 font-semibold text-black'>{data?.trip_type == "round" ? 'Round Trip' : 'One Way Trip'}</p>
                        </div>
                    </div>
                    <div className='hidden lg:block'>
                        {TagDesign(data?.tags[0])}
                    </div>
                </div>
                <div className='flex justify-between items-start mx-4 gap-3 border-b border-gray-400 pb-4 lg:my-4 lg:ml-60 lg:mr-7'>
                    <div className='flex flex-wrap basis-[70%] lg:basis-[65%]'>
                        {
                            // data.nights === 10 && data.starting_port.name === "Singapore" ?
                            //     <p className='text-xs lg:text-lg font-semibold'> Singapore - Singapore - Kuala Lumpur - At Sea - Langkawi - Phuket - Phuket - At Sea - At Sea - At Sea - Chennai (10N/11D)</p> :
                            //     data.nights === 10 && data.starting_port.name === "Chennai" ?
                            //         <p className='text-xs lg:text-lg font-semibold'>Chennai - At Sea - At Sea - At Sea - Phuket - Phuket - Langkawi - At Sea - Kuala Lumpur - Singapore - Singapore (10N/11D)</p>
                            //         :
                            // <>
                            //     {data?.ports.map((val: any, i: any) => {
                            //         // if (val.name != 'At Sea')
                            //             return (
                            //                 <p className='text-xs lg:text-lg font-semibold'>{val.name} {data.ports.length != (i + 1) ? <span>-&nbsp;</span> : <span>&nbsp;</span>}</p>
                            //             )
                            //     })}
                            //     <p className='text-xs lg:text-lg font-semibold'>({data?.nights}N/{data?.nights + 1}D)</p>
                            // </>
                            // <p className='text-xs lg:text-xl font-semibold'>
                            //     {data?.ports.map((val: any, i: any) => {
                            //     // if (val.name != 'At Sea')
                            //         return (
                            //             <>{val.name} {data.ports.length != (i + 1) ? '- ' : null} {" "}</>
                            //         )
                            //     })}
                            //     <span className='text-xs lg:text-lg font-semibold'>({data?.nights}N/{data?.nights + 1}D)</span>
                            // </p>
                            // <p className='text-xs lg:text-lg font-semibold'>
                            //     {data?.ports.map((val: any, i: any) => {
                            //         const itiName = `${val.name} ${data.ports.length != (i + 1) ? '- ' : null} `
                            //     // if (val.name != 'At Sea')
                            //         return (
                            //             // <>{val.name} {data.ports.length != (i + 1) ? '- ' : null} {" "}</>
                            //             itiName
                            //         )
                            //     })}
                            //     <span className='text-xs lg:text-lg font-semibold'>({data?.nights}N/{data?.nights + 1}D)</span>
                            // </p>
                            <p className={`text-xs lg:text-lg font-semibold`}>
                                {itineraryName}
                                <span className="ml-1 text-xs lg:text-lg font-semibold">
                                    ({data?.nights}N/{data?.nights + 1}D)
                                </span>
                            </p>
                            // <div>
                            //     <p className={`text-xs lg:text-lg font-semibold ${isLong && !isExpanded ? 'line-clamp-4' : ''}`}>
                            //         {itineraryName}
                            //         <span className="ml-1 text-xs lg:text-lg font-semibold">
                            //             ({data?.nights}N/{data?.nights + 1}D)
                            //         </span>
                            //     </p>

                            //     {/* Toggle Button */}
                            //     {isLong && (
                            //         <button
                            //             onClick={() => setIsExpanded(prev => !prev)}
                            //             className="text-xs lg:text-sm mt-1 text-brand-primary font-bold"
                            //         >
                            //             {isExpanded ? 'Read less' : 'Read more'}
                            //         </button>
                            //     )}
                            // </div>
                        }
                    </div>
                    <div className='flex gap-1 rounded-[32px] py-1 px-2 border lg:border-2 border-brand-primary items-center basis-auto justify-end lg:py-1 lg:px-4' style={{
                        border: '2px solid transparent',
                        backgroundImage:
                            'linear-gradient(#fff, #fff), linear-gradient(99.72deg, #92278f -17.25%, #ea725b 105.93%)',
                        backgroundClip: 'padding-box, border-box',
                        backgroundOrigin: 'border-box'
                    }}>
                        <div className='w-4 lg:w-8'>
                            <img src={"https://images.cordeliacruises.com/cordelia_v2/public/assets/new-flow-icons_gradient.svg"} alt="cruise_icon" />
                        </div>
                        <div className='text-xxs lg:text-sm text-brand-primary font-bold'>{data?.ship?.name}</div>
                    </div>
                </div>

                <div className='px-4 lg:pl-60'>
                    <div className='mt-4'>
                        <p className='text-xs lg:text-sm text-gray-100 font-normal'>Visiting Ports</p>
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
                        {/* <div className='flex flex-wrap'>
                            {
                                data.nights === 10 && (data.starting_port.name === "Singapore" || data.starting_port.name === "Chennai")
                                    ? filteredPorts.map((name, i, arr) => (
                                        <div key={i}>
                                            <p className="text-xs lg:text-base font-medium">
                                                {name} {i !== arr.length - 1 ? <span>| </span> : null}
                                            </p>
                                        </div>
                                    ))
                                    : data.ports.map((val: any, i: any) => {
                                        if (val.name !== "At Sea")
                                            return (
                                                <div key={i}>
                                                    <p className="text-xs lg:text-base font-medium">
                                                        {val.name} {i !== data.ports.length - 1 ? <span>| </span> : null}
                                                    </p>
                                                </div>
                                            );
                                    })
                            }
                        </div> */}
                    </div>
                    <div className='border-t border-gray-300 my-4 w-[96%]' />
                </div>
                {/* Web Design */}
                <div className='pl-4 lg:pl-60 hidden lg:block'>
                    <div className='grid grid-cols-12 items-end'>
                        <div className='col-span-6 pb-4'>
                            {data && data.offers_available && data.offers_available.length ?
                                <div>
                                    <p className='text-xxs lg:text-sm text-brand-blue font-medium mb-2'>Available Offers</p>
                                    <div className='grid grid-cols-2'>
                                        {data.offers_available.slice(0, 4).map((val: any, i: any) => (
                                            <div className='flex items-center mt-2' key={i}>
                                                <img className='mr-2 h-6' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offer-upcoming-icon.svg" alt="" />
                                                <p className='text-xs lg:text-xs font-semibold text-brand-green-text'>{typeof val === 'object' ? (val.offer || '') : val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                : null
                            }
                        </div>
                        <div className='col-span-6 text-right flex flex-col items-end pr-4 lg:pr-6'>
                            {showPrice ?
                                <>
                                    <div className=''>
                                        <p className="text-xxs text-gray-100 mb-1.5">Starting From</p>
                                        {data?.discount_pct != 0 ?
                                            <p className="text-xs line-through text-gray-100">{`₹${FormatAmount(data?.actual_per_guest_per_night)}`}</p>
                                            : null}
                                        <p className="text-[1.6rem] font-bold mb-1">{`₹${FormatAmount(data?.per_guest_per_night)}`}</p>
                                        <p className="text-xxs mb-0 text-gray-100">Excl. GST Per Person in Double Occupancy</p>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        {type === 'upcoming' ? (
                                            <Button
                                                text="BOOK NOW"
                                                size="sm"
                                                className='!text-xs'
                                                type="secondary"
                                                handleClick={() => BookNow(data.itinerary_id)}
                                            />
                                        ) : (
                                            <Button
                                                text="VIEW ITINERARY"
                                                size="sm"
                                                className='!text-xs'
                                                type='secondary'
                                                handleClick={() => ViewItinerary(data.itinerary_id)}
                                            />
                                        )}

                                        {type === 'upcoming' ? (
                                            <Button
                                                text="VIEW ITINERARY"
                                                size="sm"
                                                handleClick={() => ViewItinerary(data.itinerary_id)}
                                                className='!text-xs'
                                            />
                                        ) : (
                                            <Button
                                                text="RESCHEDULE"
                                                size="sm"
                                                handleClick={() => rescheduleItinerary(data)}
                                                className='!text-xs'
                                            />
                                        )}
                                    </div>
                                </>
                                :
                                <div className='mt-3 flex'>
                                    {/* <button onClick={() => callBack(data?.itinerary_id)} className='text-xs min-w-[180px] text-center lg:text-base cursor-pointer border-1 border-brand-primary bg-brand-primary text-white px-4 py-2 font-semibold rounded ml-4'>Reveal Prices</button> */}
                                    <Button text='Reveal Prices' size='sm' handleClick={() => callBack(data?.itinerary_id)} className='min-w-[180px] ml-4' />
                                </div>
                            }
                        </div>
                    </div>
                </div>

                {/* Mobile Design */}
                <div className='lg:hidden'>
                    {data?.tags[0] && <div className='flex justify-end mb-3'>
                        {TagDesign(data?.tags[0])}
                    </div>}
                    <div className='grid grid-cols-2 items-center relative'>
                        <div className='px-4'>
                            {data && data.offers_available && data.offers_available.length ?
                                <div>
                                    <p className='text-xs text-brand-blue font-normal mb-1'>Available Offers</p>
                                    {data.offers_available.slice(0, 4).map((val: any, i: any) => (
                                        <div className='flex items-center' key={i}>
                                            <img className='mr-2 h-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offer-upcoming-icon.svg" alt="" />
                                            <p className='text-xxs font-semibold text-brand-green-text'>{typeof val === 'object' ? (val.offer || '') : val}</p>
                                        </div>
                                    ))}
                                </div>
                                : null
                            }
                        </div>
                        {showPrice ?
                            <>
                                <div>
                                    <div className='pr-4 lg:pr-6 text-right px-4'>
                                        <p className="text-xxs mb-0 text-gray-100">Starting From</p>
                                        {data?.discount_pct != 0 ?
                                            <p className="text-xxs lg:text-xs mb-0.5 line-through text-gray-100">{`₹${FormatAmount(data?.actual_per_guest_per_night)}`}</p>
                                            : null}
                                        <p className="text-sm lg:text-[1.6rem] font-bold mb-1">{`₹${FormatAmount(data?.per_guest_per_night)}`}</p>
                                        <p className="text-xxs lg:text-xxs mb-0 text-gray-100">Excl. GST Per Person in Double Occupancy</p>
                                    </div>
                                </div>
                                <div className="col-span-2 px-4 flex mt-2">
                                    {type === 'upcoming' ? (
                                        <Button
                                            text="BOOK NOW"
                                            size="sm"
                                            type="secondary"
                                            handleClick={() => BookNow(data.itinerary_id)}
                                            className="w-full"
                                        />
                                    ) : (
                                        <Button
                                            text="VIEW ITINERARY"
                                            size="sm"
                                            type='secondary'
                                            handleClick={() => ViewItinerary(data.itinerary_id)}
                                            className="w-full"
                                        />
                                    )}
                                    {type === 'upcoming' ? (
                                        <Button
                                            text="VIEW ITINERARY"
                                            size="sm"
                                            handleClick={() => ViewItinerary(data.itinerary_id)}
                                            className="ml-4 w-full"
                                        />
                                    ) : (
                                        <Button
                                            text="RESCHEDULE"
                                            size="sm"
                                            handleClick={() => rescheduleItinerary(data)}
                                            className="ml-4 w-full"
                                        />
                                    )}
                                </div>
                            </>
                            :
                            <div className='pr-4 lg:pr-6 text-right'>
                                {/* <button onClick={() => callBack(data?.itinerary_id)} className='text-xs w-full text-center lg:text-base cursor-pointer border-1 border-brand-primary bg-brand-primary text-white px-2 py-2 font-semibold rounded'>Reveal Prices</button> */}
                                <Button text='Reveal Prices' size='sm' handleClick={() => callBack(data?.itinerary_id)} className='w-full' />
                            </div>
                        }
                    </div>
                </div>
            </div>
            {data?.status == "BOOKED" ?
                <div className='absolute top-[-20px] lg:top-0 left-0 w-full h-full bg-white/50 flex items-start lg:items-center'>
                    <img className='w-[150px] lg:w-[200px] ml-24 lg:ml-28 mt-10 lg:mt-0' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/Sold+Out.svg" alt="" />
                </div>
                : null}
        </div>
    );
}