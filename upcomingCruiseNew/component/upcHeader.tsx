import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { GetStore, SaveStore, GetAuth } from '../../../utils/store/store';

type Props = {
    showUser?: boolean
}

export default function UpcHeader({ showUser = true }: Props) {
    const [token, setToken] = useState('');
    const [show, setShow] = useState(false);

    const store = GetStore();
    let navigate = useNavigate()

    useEffect(() => {
        setToken(GetAuth()?.token)
    }, [GetAuth()])

    const handleLogOut = () => {
        localStorage.clear();
        navigate(0);
    }

    return (
        <div className='flex gap-4'>
            <div className="flex items-center gap-2">
                <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/call-new-icon.svg" alt="" />
                <a
                    href="tel:022-68811111"
                    className={`text-xs lg:text-base font-medium block text-white`}
                    aria-current="page"
                >
                    022-68811111
                </a>
            </div>
            <div className="flex items-center gap-2">
                <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/whatsapp-new-icon.svg" alt="" />
                <a
                    href="https://wa.me/917738850000"
                    className={`text-xs lg:text-base font-medium block text-white`}
                    aria-current="page"
                >
                    +91 7738850000
                </a>
            </div>
            {showUser && token ? (
                <div
                    className="relative flex ml-4"
                    style={{ height: "inherit" }}
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                >
                    <div
                        className=" flex items-center relative cursor-pointer gap-2"
                        onClick={() => setShow(!show)}
                    >
                        <img
                            height={20}
                            width={20}
                            src='https://images.cordeliacruises.com/cordelia_v2/public/assets/profile-white-new-icon.svg'
                            alt="Profile Icon"
                        />
                        <button
                            className={`hidden lg:inline-block text-sm 2xl:text-base font-medium text-white`}
                        >
                            My Account
                        </button>
                        <div
                            className={`w-3 h-3 ${show ? 'rotate-180' : ''
                                }`}
                        >
                            <img
                                className="w-full h-full"
                                src='https://images.cordeliacruises.com/cordelia_v2/public/assets/Arrow+White.svg'
                            />
                        </div>
                    </div>
                    {show ? (
                        <div className="absolute top-6 right-0 w-max rounded-b border border-gray-300 overflow-hidden shadow-md bg-white">
                            <a
                                href="/my-profile"
                                className="flex items-center gap-2 text-sm 2xl:text-base font-medium hover:text-brand-primary px-4 py-2 border-b border-gray-300 hover:bg-gray-400"
                            >
                                <div className="w-5 h-5">
                                    <img
                                        className="w-full h-full"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/profile-new-menu.svg"
                                        alt="Profile"
                                    />
                                </div>
                                <span>My Profile</span>
                            </a>
                            <a
                                href="/manage-booking"
                                className="flex items-center gap-2 text-sm 2xl:text-base font-medium hover:text-brand-primary px-4 py-2 border-b border-gray-300 hover:bg-gray-400"
                            >
                                <div className="w-5 h-5">
                                    <img
                                        className="w-full h-full"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/mybooking-new-icon.svg"
                                        alt="My Bookings"
                                    />
                                </div>
                                <span>My Bookings</span>
                            </a>
                            <a
                                onClick={handleLogOut}
                                className="flex items-center gap-2 text-sm 2xl:text-base font-medium hover:text-brand-primary px-4 py-2 hover:bg-gray-400 cursor-pointer"
                            >
                                <div className="w-5 h-5">
                                    <img
                                        className="w-full h-full"
                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/logout-purple-new-icon.svg"
                                        alt="Logout_icon"
                                    />
                                </div>
                                <span>Log Out</span>
                            </a>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}