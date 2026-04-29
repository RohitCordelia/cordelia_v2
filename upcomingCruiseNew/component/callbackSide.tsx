import { useEffect, useState } from 'react';
import Button from '../../../components/UI/Button';
import moment from 'moment';
import { useLocation } from 'react-router-dom';

type Props = {
    callback: any;
}

export default function CallbackSide({ callback }: Props) {
    const [showCallCTA, setShowCallCTA] = useState(true);
    useEffect(() => {
        const currentTime = moment().format('HH:mm:ss');
        if (currentTime >= moment('21:00:00', 'HH:mm:ss').format('HH:mm:ss') && currentTime <= moment('09:00:00', 'HH:mm:ss').format('HH:mm:ss')) {
            setShowCallCTA(false);
        }
    }, []);

    const location = useLocation();
    const isUPCPage = location.pathname === '/upcoming-cruises' || location.pathname === '/cruise-packages';

    return (
        <>
            <div
                className={`border rounded-md ${isUPCPage ? 'mt-4' : 'mt-[26px]'}`}
                style={{
                    border: 'double 1px transparent',
                    backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(260deg, #92278f -17.25%, #ea725b 105.93%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                }}
            >
                <div className='bg-gradient-to-r from-[#ffffff] to-[#fef3f1] rounded-md relative'>
                    {!isUPCPage && (
                        <div className='absolute w-[50px] h-[50px] rounded-full flex items-center justify-center mx-auto left-0 right-0 -top-8'>
                            <div className="circles">
                                <div className="circle1"></div>
                                <div className="circle2"></div>
                                <div className="circle3"></div>
                            </div>
                        <div className='bg-gradient-to-r from-[#92278F] via-[#D1527D] to-[#EA725B] w-full h-full flex items-center justify-center rounded-full z-[1]'>
                            <img className='h-10 z-50' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/call-new-icon.svg" alt="" />
                        </div>
                    </div>)}

                    <div className={isUPCPage ? 'py-2 2xl:py-5 px-5' : 'pt-[2rem] pb-2 px-5'}>
                        <div className={`text-center ${isUPCPage ? '2xl:mb-4 mb-2 px-0' : 'px-4'}`}>
                            <p
                                style={{
                                    background: '-webkit-linear-gradient(18deg, #92278F, #EA725B)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                                className={`text-[1rem] font-playfairDisplay italic font-extrabold ${isUPCPage ? 'pb-1.5 leading-5' : ''}`}
                            >
                                Your perfect cruise is one call away.
                            </p>
                            <p className={`text-gray-600 font-semibold ${isUPCPage ? 'leading-4 text-xxs' : 'text-xs'}`}>Get instant help from our cruise specialist.</p>
                        </div>
                        <Button leftIcon={<img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/call-new-icon.svg" />}handleClick={() => callback()}   size='xs' text='Request a Callback' className='w-full !py-2 !rounded-full mt-2' />
                        <Button handleClick={() => window.location.href = 'tel:022-68811111'} size='xs' text='Call - 022-68811111' type='secondary' className='w-full !py-2 !rounded-full mt-2 !border-1' />
                    </div>
                </div>
            </div>
        </>
    );
}