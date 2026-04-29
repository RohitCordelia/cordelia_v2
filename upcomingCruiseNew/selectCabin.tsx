import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import React, { useEffect, useState, useRef } from 'react'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import moment from 'moment';
import { Layout } from '../../components/Layout';
import { useGetViewItineraryMutation, useAvailableCabinMutation, useCabinPricingMutation } from '../../services/upcomingCruise/upcomingCruise';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../../components/UI/ModalCenter';
import { ADD_ADULT, ADD_CHILDREN, ADD_INFANT, ADD_ROOM, REMOVE_ROOM } from '../../constants/itineraryConstants';
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { GetAuth, SaveAuth, SaveContact, GetStore, SaveStore, GetAB } from '../../utils/store/store';
import Select from "react-select";
import { useGetUpgradeMutation } from '../../services/itinerary/itinerary'

import PhoneCode from "../../components/UI/Forms/Inputs/phoneCodes.json";
import { Input } from '../../components/UI/Forms/Inputs';
import OtpInput from 'react18-input-otp';
import { Phone } from '../../utils/validations/formValidations';
import { useForm } from 'react-hook-form';
import { checkCabinCount, checkCabinSelect, isAdultSelected } from '../../utils/rooms/room';
import { getCurrentUrlWithCampaign, getRefUrl } from '../../utils/user/user';
import { FormatAmount } from '../../utils/formatter/formatter';
import './index.css'
import toast, { Toaster } from 'react-hot-toast';
import Header from "/src/components/Header/header";
import Button from '../../components/UI/Button';
import { useGenerateOtpMutation, useVerifyOtpMutation } from '../../services/OTPLessAuth/OTPLessAuth';
import ProfileAuth from '../profile/auth';
import { getSessionTime } from '../../utils/algorithms';
import { ANALYTICS_EVENTS, trackCustomEvent } from '../../services/analytics';

type Props = {}

const cabin = [
    {
        'name': 'Interior Stateroom',
        'code': 'INTERIORSTANDARD',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend-mobile.webp',
        'subtitle': 'Welcome to your cosy haven on Decks 3 and 4. Our budget-friendly interior staterooms provide all the essentials for a comfortable and personalised experience aboard the Empress. Intently designed to make your stay special, these staterooms offer everything you need for a relaxing journey.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen-size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom, Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Television and Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Interior Upper',
        'code': 'INTERIORUPPER',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend-mobile.webp',
        'subtitle': 'Discover your cosy escape on Deck 7. Our Upper category Interior staterooms offer all the essentials to make your stay truly special. Budget-friendly yet designed for maximum comfort, these staterooms provide the perfect personal haven aboard the Empress. Plus, enjoy added perks with this exclusive category.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen-size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom, Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Television and Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Interior Premier',
        'code': 'INTERIORPREMIUM',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend-mobile.webp',
        'subtitle': 'Welcome to your cosy retreat on the sea. Our interior staterooms, situated on Decks 8 and 9, offer all the essentials to make your stay truly special. Thoughtfully designed and budget-friendly, they provide everything you need for a comfortable, personal escape aboard the Empress. Plus, enjoy exclusive perks when you book this Premier category Interior stateroom. It’s your perfect haven at sea.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen-size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom, Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Television and Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior-twin-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Obstructed Ocean View',
        'code': 'OBSTRUCTEDOCEANVIEW',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/interior-cabin-weekend-mobile.webp',
        'subtitle': 'Wake up to serene ocean views each morning from your stateroom window, located on Decks 7 and 8. Though partially obstructed, the views and atmosphere are still breathtaking. These staterooms are designed with modern amenities to ensure a comfortable and enjoyable experience at sea.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Full-size window(Obstructed)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-obstrcut-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-obstrcut-popup.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
            },
        ]
    },
    {
        'name': 'Ocean View Standard',
        'code': 'OCEANVIEWSTANDARD',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend-mobile.webp',
        'subtitle': 'Wake up to breathtaking ocean views every morning from your stateroom window, situated on Decks 3 and 4. Designed with the modern traveller in mind, our ocean view staterooms offer a perfect blend of comfort and convenience, complete with all the amenities you need for a seamless stay at sea.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Full-size window or porthole',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-porthole-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-porthole-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Ocean View Upper',
        'code': 'OCEANVIEWUPPER',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend-mobile.webp',
        'subtitle': 'Wake up to stunning ocean views from your stateroom window, located on Deck 7. Furnished with modern amenities to suit the needs of today’s traveler, this Upper category Ocean View stateroom offers a serene and comfortable retreat. Enjoy exclusive added benefits when you choose this special category.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Full-size window or porthole',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Ocean View Premier',
        'code': 'OCEANVIEWPREMIUM',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/oceanview-cabin-weekend-mobile.webp',
        'subtitle': 'Wake up to stunning ocean views every morning from your stateroom window, located on Decks 8 and 9. Designed for the modern traveller, these ocean view staterooms offer a perfect balance of comfort and style, with all the amenities you need for a seamless experience. Plus, enjoy the added benefits when you book this Premier category Ocean View stateroom.',
        'itinerary': [
            {
                'title': 'Two twin beds that convert to queen size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Full-size window or porthole',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg',
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-quad-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ocean-view-wheelchair-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/interior&ocean-washroom-popup.webp",
            },
        ]
    },
    {
        'name': 'Mini Suite',
        'code': 'BALCONYSUITE',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/minisuite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/minisuite-cabin-weekend-mobile.webp',
        'subtitle': 'Unwind in your luxurious stateroom with a private balcony, located on Decks 7, 8, and 9. Soak in the beauty of sunrises and sunsets from your personal space. Each balcony stateroom is a mini-suite, thoughtfully designed with world-class amenities for your utmost comfort.',
        'itinerary': [
            {
                'title': 'Two twin beds that can convert to queen size (72.5 by 82 inches)',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Sofa seating area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Private balcony',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Complimentary 4 water bottles of 500ml in cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg'
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-03.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-03.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-04.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/mini-suite-oct-popup-04.webp",
            },
        ],
        'note': 'No sofa seating area in 7186, 7188, 7686, 7688, 7690, 8686, 9684 cabins.'
    },
    {
        'name': 'Suite',
        'code': 'SUITE',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': 'Our exclusive suites aren’t just luxurious spaces—they’re unforgettable experiences. Located on Decks 7, 8, and 9, these suites feature separate living areas, private balconies with stunning views, and a Jacuzzi for ultimate relaxation. Furnished with world-class amenities, every moment in our suites exudes elegance and comfort.',
        'itinerary': [
            {
                'title': 'Balcony accessible from Living area and 1 window in the Bedroom area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            // {
            //     'title': 'Bathtub',
            //     'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/jacuzzi-weekend-icon.svg'
            // },
            {
                'title': '1 TV 32" Samsung. ( 1x Living Room )',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Single Sofa bed',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Fridge',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Safe in cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Tea/coffee making facility',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg'
            },
            {
                'title': 'Complimentary bottle of water in cabin as per the deck wise benefits',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-03.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-03.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-04.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-oct-popup-04.webp",
            },
        ],
    },
    {
        'name': "Chairman's Suite",
        'code': 'ROYALSUITE',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': 'Step into unparalleled luxury with the Chairman’s Suite, situated on Deck 8 for an unmatched cruising experience. This contemporary, state-of-the-art suite features a lavish living room, private dining area with a six-seater table, a stylish bar counter, master bedroom, walk-in closet, and a private sun-deck balcony with a Jacuzzi. Indulge in special amenities designed for your comfort. With priority check-in and check-out, let the Chairman’s Suite be your gateway to limitless experiences at sea.',
        'itinerary': [
            {
                'title': 'Separate master Bedroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/master-bedroom-weekend-icon.svg',
            },
            {
                'title': '1 window view from the bedroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Walk-in Closet',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/walk-closet-weekend-icon.svg',
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/vanity-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom with Whirlpool bath, separate Shower & bath robes',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Bathroom amenities in Miniatures',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Dining Area 6 Seat table',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/dining-weekend-icon.svg',
            },
            {
                'title': '2x window views from the dining area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg',
            },
            {
                'title': 'Living Room - lounge area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/living-area-weekend-icon.svg',
            },
            {
                'title': 'Bar Counter with 3 bar stools',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/barcounter-weekend-icon.svg',
            },
            {
                'title': '1 balcony accessible from the living area, Sunbeds with table and chairs',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg',
            },
            {
                'title': 'Samsung TV 65" in the Living Room and 40" in the Bedroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Refrigerator',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg',
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
            {
                'title': 'Locker in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Tea/coffee making facility',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg',
            },
            {
                'title': 'Complimentary 4 water bottles of 500ml of in the cabin',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/water-weekend-icon.svg',
            },
            {
                'title': 'Mini Bar on request – chargeable',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/minibar-weekend-icon.svg',
            },
            {
                'title': 'Butler service',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/butler-weekend-icon.svg',
            },

        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-03.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-03.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-04.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-04.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-05.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-05.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-06.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-06.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-07.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-07.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-08.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-08.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-09.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-09.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-10.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/chairman-suite-oct-popup-10.webp",
            },
        ],
    },
    {
        'name': "Interior",
        'code': 'INSIDE2',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Set sail in comfort and style. You'll find everything you need here inside. Stylish and modern appointments include a TV, sitting area and more.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg',
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg',
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg',
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg',
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg',
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-new-web-image-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-inside-booking-popup-new-web-image-02.webp",
            },
        ],
    },
    {
        'name': "Oceanview",
        'code': 'OCEANVIEW2',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Discover the beauty of style and comfort. Cozy and modern staterooms feature excellent appointments. Accented by stylish touches and clear views of the ocean.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Window or porthole',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg'
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg'
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            }
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-oceanview-booking-popup-web-image-02.webp",
            },
        ],
    },
    {
        'name': "Mini Suite",
        'code': 'BALCONY2',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "See the world in a whole new way from your own private balcony. Well-appointed and stylish accommodation offer plenty of room to unwind inside.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Balcony',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "http://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-web-image-01.webp",
                thumbnail: "http://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-new-web-image-02.webp",
            },
            {
                original: "http://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-web-image-01.webp",
                thumbnail: "http://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-balcony-booking-popup-new-web-image-02.webp",
            },
        ],
    },
    {
        'name': "Suite",
        'code': 'SUITE2',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Indulge in luxury at sea. These spacious suites are ideal for two…or the entire family. Enjoy the finest amenities including sweeping private balconies.",
        'itinerary': [
            {
                'title': 'Balcony accessible from Living area and 1 window in the Bedroom area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Fridge',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Coffee Machine',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg'
            }
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-03.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-03.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-02.webp",
            },
        ],
    },
    {
        'name': "Chairman Suite",
        'code': 'ROYALSUITE2',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "The Chairman’s Suite offers a private bedroom, spacious living and dining areas, and a luxurious bath with a whirlpool tub. Step out onto your large balcony with a private hot tub and soak in spectacular sea views—every moment here is designed to impress.",
        'itinerary': [
            {
                'title': 'Balcony',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Fridge',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Coffee Machine ',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-04.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-04.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-01.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/suite-booking-top-view-popup-new-web-image-01.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-02.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-02.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-04.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sky-ownersuite-booking-popup-web-image-04.webp",
            },
        ],
    },
    {
        'name': "Inside",
        'code': 'INSIDE3',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Set sail in comfort and style. You'll find everything you need here inside. Stylish and modern appointments include a TV, sitting area and more.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-inside-if-web-upcoming.webp'
            },
            {
                'original': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp',
                'thumbnail': 'https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-insde-web-upcoming.webp'
            },

        ],
    },
    {
        'name': "Oceanview",
        'code': 'OCEANVIEW3',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Discover the beauty of style and comfort. Cozy and modern staterooms feature excellent appointments. Accented by stylish touches and clear views of the ocean.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Window or porthole',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/window-weekend-icon.svg'
            },
            {
                'title': 'Private bathroom',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/bathroom-weekend-icon.svg'
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Hair Dryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ncl-sun-oceanview-pict-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ncl-sun-oceanview-pict-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ocnvw-pctrwndw-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ocnvw-pctrwndw-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/ncl-sun-oceanview-pict-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/ncl-sun-oceanview-pict-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ocnvw-pctrwndw-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ocnvw-pctrwndw-web-upcoming.webp",
            },
        ],
    },
    {
        'name': "Balcony",
        'code': 'BALCONY3',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "See the world in a whole new way. Floor-to-ceiling glass doors open to your own private balcony. Well-appointed and stylish accommodation offer plenty of room to unwind inside.",
        'itinerary': [
            {
                'title': 'Two twin beds',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/twin-bed-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Balcony',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Vanity area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Telephone',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/intercom-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-balcny-bb-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-balcny-bb-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-blcny-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-blcny-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-balcny-bb-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-balcny-bb-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-blcny-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-blcny-web-upcoming.webp",
            },
        ],
    },
    {
        'name': "Suite",
        'code': 'SUITE3',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "Indulge in luxury at sea. These spacious suites are ideal for two…or the entire family. Enjoy the finest amenities including sweeping private balconies.",
        'itinerary': [
            {
                'title': 'Balcony accessible from Living area and 1 window in the Bedroom area',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Fridge',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Coffee Machine',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-aft-pent-bdrm-se-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-aft-pent-bdrm-se-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-aft-pent-lvgrm-se-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-aft-pent-lvgrm-se-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-pnthse-blcny-sf-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-pnthse-blcny-sf-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sf-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sf-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sg-web-upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sg-web-upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sf-web-upcomimg.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ff-pent-sf-web-upcomimg.webp",
            },
        ],
    },
    {
        'name': "Chairman Suite",
        'code': 'ROYALSUITE3',
        'image': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend.webp',
        'mobileImage': 'https://images.cordeliacruises.com/cordelia_v2/public/images/suite-cabin-weekend-mobile.webp',
        'subtitle': "The Chairman’s Suite features a private bedroom with a queen-size bed, spacious living and dining areas, a luxurious bath, and an additional guest bath. Step onto your private balcony with a hot tub and take in breathtaking views. Perfect for up to four guests, with the option to connect to a Balcony Stateroom—ideal for family or friends.",
        'itinerary': [
            {
                'title': 'Balcony',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/balcony-weekend-icon.svg'
            },
            {
                'title': 'Television',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/tv-weekend-icon.svg'
            },
            {
                'title': 'Sofa',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/sofabed-weekend-icon.svg'
            },
            {
                'title': 'Fridge',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/refrigerator-weekend-icon.svg'
            },
            {
                'title': 'Hairdryer',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/hairdryer-weekend-icon.svg'
            },
            {
                'title': 'Locker',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/safe-weekend-icon.svg'
            },
            {
                'title': 'Coffee Machine ',
                'icon': 'https://images.cordeliacruises.com/cordelia_v2/public/assets/coffee-machine-weekend-icon.svg'
            },
        ],
        'imageArr': [
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-bdrm-sb-web_upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-bdrm-sb-web_upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-lvgrm-sb-web_upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-lvgrm-sb-web_upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ownrs-suite-web_upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-shmtc-ownrs-suite-web_upcoming.webp",
            },
            {
                original: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-bdrm-sb-web_upcoming.webp",
                thumbnail: "https://images.cordeliacruises.com/cordelia_v2/public/images/sun-ownerssuite-bdrm-sb-web_upcoming.webp",
            },
        ],
    },
]

const count = [
    {
        number: 0
    },
    {
        number: 1
    },
    {
        number: 2
    },
    {
        number: 3
    },
    {
        number: 4
    },
    {
        number: 5
    }
]

const customStyles = {
    control: (styles: any, { isDisabled }: any) => ({
        ...styles,
        backgroundColor: isDisabled ? 'rgb(232, 240, 254)' : '#f5f5f5',
        height: '48px', border: 0
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        borderBottom: '1px dotted #ccc',
        padding: 10,
        zIndex: 999
    }),
    menu: (styles: any) => ({
        ...styles,
        width: '300px',
        zIndex: 9999
    }),
    menuPortal: (base: any) => ({
        ...base, zIndex: 9999
    })
};

export default function SelectCabin({ }: any) {
    const store = GetStore();
    const ref = useRef<HTMLInputElement>(null);

    const [getViewItinerary] = useGetViewItineraryMutation()
    const [availableCabinMutation] = useAvailableCabinMutation()
    const [cabinPricing] = useCabinPricingMutation()
    const [generateOtp] = useGenerateOtpMutation();
    const [verifyOtp] = useVerifyOtpMutation();
    const [getUpgrade] = useGetUpgradeMutation();

    const AUTH = GetAuth();
    const ab = GetAB();
    const TIMER_DURATION = 30
    const END_TIMER = 0
    const currentUrl = window.location.href;

    let navigate = useNavigate()
    let location = useLocation();
    const itineraryId = new window.URLSearchParams(window.location.search).get('id');

    const [otpReqId, setOtpReqId] = useState<any>();
    const [isLoading, setIsLoading] = useState<any>();
    const [isLoading1, setIsLoading1] = useState<any>();
    const [priceLoading, setPriceLoading] = useState<any>(false);
    const [itineraryData, setItineraryData] = useState<any>();
    const [cabinData, setCabinData] = useState<any>();
    const [amenitiesModal, setAmenitiesModal] = useState<any>(false);
    const [activeAmenities, setActiveAmenities] = useState<any>();
    const [amenitiesData, setAmenitiesData] = useState<any>([]);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [timer, setTimer] = useState<number>(30);
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOtp] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [country, setCountry] = useState('+91');
    const [selectedCabinDetail, setSelectedCabinDetail] = useState<any>([]);
    const [totalGuest, setTotalGuest] = useState<any>();
    const [totalPrice, setTotalPrice] = useState<any>();
    const [actualTotalPrice, setActualTotalPrice] = useState<any>();
    const [cabinDetail, setCabinDetail] = useState<any>(false);
    const [nextLoading, setNextLoading] = useState<any>(false);
    const [selectedRooms, setSelectedRooms] = useState<any>();
    const [readMoreModal, setReadMoreModal] = useState<any>();
    const [readMoreContent, setReadMoreContent] = useState<any>();
    const [sortBy, setSortBy] = useState<any>(false);
    const [SelectedSortBy, selectedSortBy] = useState<any>('lowToHigh');
    const [isExpanded, setIsExpanded] = useState(false);
    const [token, setToken] = useState('');

    const [isPopupVisible, setPopupVisible] = useState(false);
    const [cabinLimitExceed, setCabinLimitExceed] = useState(false);
    const popupRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (AUTH?.token && AUTH.exp > Math.round(+new Date() / 1000)) {
            setShowPhoneModal(false)
        } else {
            if (ab == 2) {
                setShowPhoneModal(true)
            } else {
                setShowPhoneModal(false)
            }
        }
    }, []);

    useEffect(() => {
        setToken(GetAuth()?.token);
    }, [GetAuth()])

    const SamplePrevArrow = (props: any) => {
        const { className, onClick } = props;
        return (
            <div onClick={onClick} className={`arrow ${className}`} >
                <img className='drop-shadow-xl h-4' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/left-arrow.svg' />
            </div>
        )
    }

    function SampleNextArrow(props: any) {
        const { className, onClick } = props;
        return (
            <div onClick={onClick} className={`arrow ${className}`} >
                <img className='drop-shadow-xl h-4' src='https://images.cordeliacruises.com/cordelia_v2/public/assets/right-arrow.svg' />
            </div>
        )
    }

    var settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <SampleNextArrow to="next" />,
        prevArrow: <SamplePrevArrow to="prev" />,
    };

    useEffect(() => {
        const _payload = {
            itinerary_id: itineraryId
        }
        setIsLoading(true)
        getViewItinerary(_payload)
            .unwrap()
            .then((res: any) => {
                setItineraryData(res)
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
        setIsLoading1(true)
        const _payload = {
            itinerary_id: itineraryId
        }
        availableCabinMutation(_payload)
            .unwrap()
            .then((res: any) => {
                const sortedRes = [...res].sort((a: any, b: any) => {
                    if (a.per_guest === 0) return 1;
                    if (b.per_guest === 0) return -1;
                    return a.per_guest - b.per_guest;
                });
                setCabinData(sortedRes)
                setIsLoading1(false)
                window.scroll({
                    top: 0,
                    left: 0
                });
            })
            .catch((res: any) => {
                setIsLoading1(false)
                console.log('Error: ', res)
            })
    }, [])


    // const arrival = itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival;
    const arrival = `${itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival.split(',')[0]}, ${itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival.split(' ').slice(-2).join(' ')}`;
    // const departure = itineraryData?.ports[0]?.departure;
    const departure = `${itineraryData?.ports[0]?.departure.split(',')[0]}, ${itineraryData?.ports[0]?.departure.split(' ').slice(-2).join(' ')}`;

    useEffect(() => {
        if (activeAmenities) {
            let a = cabin.find((item) => item.code == activeAmenities);
            if (a) {
                setAmenitiesModal(true)
                setAmenitiesData(a);
            }
        }
    }, [activeAmenities])

    const handleEditPhone = () => {
        setShowOTP(false)
        setOtp("")
    }

    const {
        setError,
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            phone_number: "",
            otp: ""
        }
    });

    const onSubmitOTP = (data: any) => {
        const cleanedUrl = getCurrentUrlWithCampaign();
        setPhoneNumber(data.phone_number);
        const _payload = {
            phoneNumber: data.phone_number,
            countryCode: country,
            website: cleanedUrl || window.location.href,
        };
        generateOtp(_payload)
            .unwrap()
            .then((response) => {
                setShowOTP(true)
                setOtpReqId(response?.result?.requestId)
            })
            .catch((response) => {
                setError('phone_number', { type: 'custom', message: 'Failed to send OTP' });
            })
    }

    const resendOTP = () => {
        setTimer(TIMER_DURATION);
        onSubmitOTP({ phone_number: phoneNumber })
    }

    const onVerifyOTP = () => {
        const cleanedUrl = getCurrentUrlWithCampaign();
        const sessionTime = getSessionTime()
        const _payload = {
            requestId: otpReqId,
            otp: otp,
            website: cleanedUrl,
            sessionTime: sessionTime
        };
        verifyOtp(_payload)
            .unwrap()
            .then((response) => {
                sessionStorage.removeItem("_st");
                if (!AUTH?.token) {
                    const resData = {
                        exp: response?.result?.exp,
                        is_profile_completed: response?.result?.isProfileCompleted,
                        lead_id: response?.result?.leadId,
                        token: response?.result?.token,
                        refreshToken: response?.result?.refreshToken
                    }
                    SaveAuth(resData)
                    SaveContact({ data: phoneNumber })
                    window.dispatchEvent(new Event("authChanged"));
                }
                setShowPhoneModal(false);
            })
            .catch((response) => {
                setError('otp', { type: 'custom', message: response?.message || 'Failed to verify OTP' });
            })
    }

    const CountDropdown = ({
        disabled,
        cabin,
        add,
        type,
        index,
        maxCapacity,
        onPaxChange = () => { }
    }: any) => {
        const [open, setOpen] = useState(false);

        return (
            <div className='shadow-sm rounded'>
                <Listbox disabled={disabled} value={type} onChange={onPaxChange}>
                    <ListboxButton className={`border  ${disabled ? 'bg-gray-100/10' : ''} border-gray-300 shadow-allSide w-full px-4 flex items-center text-sm lg:text-lg  py-2 justify-between rounded`}>
                        {type}
                        <img className={`h-1.5 lg:h-2`} src="https://www.cordeliacruises.com/assets/icons/footer/chevon-down-black.svg" alt="" />
                    </ListboxButton>
                    <ListboxOptions anchor="bottom" className={`w-[var(--button-width)] focus:outline-none transition duration-100 ease-in shadow-allSide`}>
                        {count?.slice(0, maxCapacity + 1).map((person: any) => (
                            <ListboxOption key={person?.number} value={person?.number} className="group flex cursor-pointer hover:bg-gray-300 items-center gap-2 py-1.5 px-3 select-none data-[focus]:bg-white/10 bg-gray-400">
                                {person?.number}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Listbox>
            </div>
        )
    }

    const selectCabin = (cabinIndex: any) => {
        const updatedFirstIndex = {
            ...cabinData[cabinIndex], rooms: [
                {
                    adults: 0,
                    children: 0,
                    infants: 0,
                    seq_no: 1,
                }
            ],
            selected: ""
        };
        const updatedCabinData = [
            ...cabinData.slice(0, cabinIndex),
            updatedFirstIndex,
            ...cabinData.slice(cabinIndex + 1),
        ];
        setCabinData(updatedCabinData);
    }

    const fetchCabinPrice = () => {
        // setPriceLoading(true)
        const newArray = cabinData.map((item: any) => {
            if (item.rooms) return {
                category_code: item.code,
                rooms: item.rooms
            }
        }).filter((item: any) => item != null);

        const _payload = {
            itinerary_id: itineraryId,
            data: newArray
        };

        cabinPricing(_payload)
            .unwrap()
            .then((res: any) => {
                const newArray = res?.pricings?.map((item: any) => {
                    const { pricings, ...rest } = item;
                    return {
                        ...rest,
                        category_details: Array.isArray(pricings) ? pricings[0] : null,
                        selected: pricings[0]?.code,
                        error: Array.isArray(pricings) ? null : pricings,
                    };
                });

                let totalPrice = 0;
                let actualTotalPrice = 0;
                let totalGuest = 0;
                let cabin = []

                for (const group of res.pricings) {
                    totalGuest += (group.adults + group.children + group.infants);
                    for (const pricing of group.pricings) {
                        totalPrice += pricing.total;
                        actualTotalPrice += pricing.actual_total;
                    }
                    cabin.push({
                        cabinName: group.pricings[0].name,
                        totalGuest: (group.adults + group.children + group.infants)
                    })
                }
                setSelectedRooms(newArray)
                setSelectedCabinDetail(cabin)
                setTotalGuest(totalGuest)
                setTotalPrice(totalPrice)
                setActualTotalPrice(actualTotalPrice)
                // setSelectedRooms(JSON.parse(JSON.stringify(res.pricings)))
            })
            .catch((res: any) => {
                setSelectedRooms([])
                setSelectedCabinDetail([])
                setTotalGuest('')
                setTotalPrice('')
                setActualTotalPrice('')
                console.log('Error: ', res)
            })
        setPriceLoading(false);
    }

    const onRoomChange = (type: string, index: any, roomIndex: any, val: any) => {
        const newCabinDate = [...cabinData];
        let selectedCabin = newCabinDate[index];
        let roomCount = selectedCabinDetail.length;

        switch (type) {
            case ADD_ROOM:
                console.log('roh selectedCabinDetail', selectedCabinDetail);

                if (selectedCabinDetail.length == 4) {
                    setCabinLimitExceed(true)
                } else {
                    if (selectedCabin?.code != 'ROYALSUITE') {
                        selectedCabin.rooms.push({
                            adults: 0,
                            children: 0,
                            infants: 0,
                            seq_no: selectedCabin.rooms.length + 1,
                        });
                        setCabinData(newCabinDate)
                    }
                    setCabinLimitExceed(false)
                }
                break;

            case REMOVE_ROOM:
                if (newCabinDate[index] && newCabinDate[index].rooms.length > roomIndex) {
                    newCabinDate[index].rooms.splice(roomIndex, 1);
                }
                setCabinData(newCabinDate)
                setCabinLimitExceed(false)
                fetchCabinPrice()
                break;

            case ADD_ADULT:
                selectedCabin.rooms[roomIndex].adults = val
                setCabinData(newCabinDate)
                fetchCabinPrice()
                break;

            case ADD_CHILDREN:
                selectedCabin.rooms[roomIndex].children = val
                setCabinData(newCabinDate)
                fetchCabinPrice()
                break;

            case ADD_INFANT:
                selectedCabin.rooms[roomIndex].infants = val
                setCabinData(newCabinDate)
                fetchCabinPrice()
                break;

            default:
                break;
        }
    }

    useEffect(() => {
        if (cabinLimitExceed) {
            const timer = setTimeout(() => {
                setCabinLimitExceed(false);
            }, 10000); // 30 seconds

            // Cleanup the timeout if the component is unmounted or `isTrue` changes
            return () => clearTimeout(timer);
        }
    }, [cabinLimitExceed])

    const checkLogin = (index: any) => {
        if (AUTH?.token && AUTH.exp > Math.round(+new Date() / 1000)) {
            let roomCount = 0
            for (const cabin of cabinData) {
                if (cabin && cabin?.rooms?.length) {
                    roomCount += cabin?.rooms?.length
                }
            }
            if (roomCount == 4) {
                setCabinLimitExceed(true)
            } else {
                selectCabin(index)
            }
        } else {
            setShowPhoneModal(true);
            setTimer(TIMER_DURATION);
        }
    }

    useEffect(() => {
        if (showPhoneModal && showOTP) {
            if (timer && timer !== END_TIMER) {
                var tempTimer = setInterval(
                    () => setTimer(timer - 1),
                    // () => setTimer(moment(timer, TIMER_FORMAT).subtract(1, 's').format('mm : ss')),
                    1000
                );
                return function cleanup() {
                    clearInterval(tempTimer);
                };
            }
        }
    }, [showPhoneModal, timer, showOTP]);

    const CabinError = (cabinCode: any, seq_no: any) => {
        let newArray = selectedRooms?.filter((room: any) => room.category_code == cabinCode)
        const seqNosWithError = newArray?.filter((item: any) => item.error !== null).map((item: any) => item.seq_no);
        let a = seqNosWithError?.find((item: any) => item == seq_no)
        if (a) {
            return (
                <p className='text-sm text-danger font-semibold my-2 px-2'>No cabin available</p>
            )
        }
    }

    const CabinCard = ({ cabin, index, maxCapacity }: any) => {
        return (
            <div className='border-gray-400 shadow-allSide rounded-lg mb-3  px-2 py-2'>
                <div className='grid grid-cols-5'>
                    <div className='col-span-5 lg:col-span-2 cabinSlider'>
                        <Slider {...settings}>
                            {cabin.images.map((val: any) => (
                                <div>
                                    <img
                                        onClick={() => {
                                            setActiveAmenities(cabin?.code)
                                        }}
                                        src={val}
                                        className='h-[200px] w-full cursor-pointer' alt=""
                                    />
                                </div>
                            ))}
                        </Slider>
                    </div>
                    <div className='col-span-5 lg:col-span-3 pl-2 lg:pl-4 pr-2 lg:pr-0 py-2'>
                        <div className='grid grid-cols-3'>
                            <div className='col-span-3 lg:col-span-2'>
                                <div className='flex justify-between items-center'>
                                    <p className='text-base lg:text-lg font-semibold'>{cabin.name}</p>
                                    <p onClick={() => { setActiveAmenities(cabin?.code) }} className='text-xs lg:hidden lg:text-sm text-brand-blue-2 underline underline-offset-2 font-medium cursor-pointer'>View Amenities</p>
                                </div>
                                <p className='text-xs lg:text-sm mt-1 font-light text-gray-100'>
                                    {cabin?.description?.split(' ').slice(0, 8).join(' ')}...
                                    <span onClick={() => {
                                        setReadMoreModal(true)
                                        setReadMoreContent(cabin.description)
                                        trackCustomEvent(ANALYTICS_EVENTS.READ_MORE, {
                                            page_name: 'Select Cabin',
                                            page_url: window.location.href,
                                        });
                                    }} className='text-brand-primary cursor-pointer'> Read More</span>
                                </p>
                                {/* <div className='flex items-center mt-2 justify-between'>
                                    
                                </div> */}
                            </div>
                            <div className='text-right hidden lg:block'>
                                {!cabin?.is_sold ?
                                    <div>
                                        {cabin.discount_pct != 0 ?
                                            <div className='flex items-center justify-start lg:justify-end'>
                                                <p className='line-through text-xs mr-1 font-medium'>₹ {FormatAmount(cabin.actual_per_guest)}</p>
                                                <div className='relative'>
                                                    <img className='h-[18px]' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-booking-icon.svg" alt="" />
                                                    <p className='text-[10px] absolute top-[2px] right-[3px] text-white'>10% off</p>
                                                </div>
                                            </div>
                                            : null
                                        }
                                        <p className='text-xl font-bold'>₹ {FormatAmount(cabin.per_guest)}</p>
                                        {/* <p className='text-xxs'>Excl. GST Taxes Per Person in Double Occupancy</p> */}
                                        <p className='text-xxs mt-1'>Excl. GST Per Person in Double Occupancy</p>
                                    </div>
                                    : null
                                }
                            </div>
                            <div className='col-span-3 lg:flex lg:justify-between mt-2 lg:items-center'>
                                <div className='flex items-center'>
                                    <img className='h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/max-capacity-icon.svg" alt="" />
                                    <p className='text-xs font-medium'>
                                        Max Capacity:&nbsp;
                                        {cabin?.is_sold
                                            ? cabin?.code == 'ROYALSUITE' || cabin?.code == 'BALCONYSUITE' || cabin?.code == 'SUITE' ? '3' : '4'
                                            : cabin?.max_capacity
                                        }
                                        &nbsp; Guests
                                    </p>
                                </div>
                                <div className='flex items-center'>
                                    <img className='h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/deck-8-icon.svg" alt="" />
                                    <p className='text-xs font-medium'>
                                        Available Decks:&nbsp;
                                        {cabin?.deck_no?.join(', ')}
                                        {/* {cabin?.is_sold
                                            ? cabin?.code == 'ROYALSUITE' || cabin?.code == 'BALCONYSUITE' || cabin?.code == 'SUITE' ? '3' : '4'
                                            : cabin?.max_capacity
                                        } */}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='border-t mt-2 lg:hidden border-gray-300' />
                        <div className='flex justify-between items-center mt-2 lg:mt-4'>
                            <p onClick={() => { setActiveAmenities(cabin?.code) }} className='hidden lg:block text-xs lg:text-sm text-brand-blue-2 underline underline-offset-2 font-medium cursor-pointer'>View Amenities</p>
                            <div className='text-left lg:hidden'>
                                {!cabin?.is_sold ?
                                    <div>
                                        {cabin.discount_pct != 0 ?
                                            <div className='flex items-center justify-start lg:justify-end'>
                                                <p className='line-through text-xs mr-1 font-medium'>₹ {FormatAmount(cabin.actual_per_guest)}</p>
                                                <div className='relative'>
                                                    <img className='h-[18px]' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-booking-icon.svg" alt="" />
                                                    <p className='text-[10px] absolute top-[2px] right-[3px] text-white'>10% off</p>
                                                </div>
                                            </div>
                                            : null
                                        }
                                        <p className='text-xl font-bold'>₹ {FormatAmount(cabin.per_guest)}</p>
                                        {/* <p className='text-xxs'>Excl. GST Taxes Per Person in Double Occupancy</p> */}
                                        <p className='text-xxs mt-1'>Excl. GST Per Person in Double Occupancy</p>
                                    </div>
                                    : null
                                }

                            </div>
                            {cabin?.is_sold ? (
                                <button
                                    // onClick={() => checkLogin(index)}
                                    disabled={checkCabinCount(cabinData)}
                                    className='lg:hidden border-1 border-gray-100 px-9 py-3 text-xs font-semibold rounded text-white bg-gray-100'>
                                    Sold Out
                                </button>
                            ) : cabin.rooms && cabin.rooms.length ? null :
                                // <button
                                //     style={{
                                //         textWrap: 'nowrap'
                                //     }}
                                //     onClick={() => checkLogin(index)}
                                //     disabled={checkCabinCount(cabinData)}
                                //     className='border-1 border-brand-primary px-5 py-3 text-xs font-semibold rounded text-brand-primary disabled:border-brand-primary/20 disabled:text-brand-primary/20 disabled:cursor-not-allowed'>
                                //     Choose Cabin
                                // </button>
                                <Button text='Choose Cabin' size='sm' type='secondary' disabled={checkCabinCount(cabinData)} handleClick={() => checkLogin(index)} className='whitespace-nowrap' />
                            }
                        </div>
                        {cabin?.is_sold ?
                            <div className='flex justify-between items-end mt-2'>
                                <div className='bg-danger/10 px-4 py-1.5 rounded flex items-center w-full lg:w-auto justify-center'>
                                    <img className='h-5' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cabin-not-avaialble-error-icon.svg" alt="" />
                                    <p className='text-xxs'>Cabins Not Available on this category</p>
                                </div>
                                <button
                                    // onClick={() => checkLogin(index)}
                                    disabled={checkCabinCount(cabinData)}
                                    className='hidden lg:block border-1 border-gray-100 px-9 py-3 text-xs font-semibold rounded text-white bg-gray-100'>
                                    Sold Out
                                </button>
                            </div>
                            : null
                        }
                    </div>
                </div>
                {cabin.rooms ?
                    <>
                        {cabin.rooms.map((val: any, roomIndex: any) => {
                            return (
                                <>
                                    <div className='border border-gray-300 mt-5 mb-3 mx-1.5 lg:mx-3 rounded'>
                                        <div className='flex justify-between py-4 border-b border-gray-300 px-4'>
                                            <p className='text-sm lg:text-lg font-semibold'>Cabin {roomIndex + 1}</p>
                                            {cabin.code != 'ROYALSUITE' && cabin.rooms.length == roomIndex + 1 ?
                                                <button
                                                    disabled={checkCabinCount(cabinData)}
                                                    className='flex items-center cursor-pointer text-xs lg:text-sm text-brand-primary font-medium disabled:text-brand-primary/40 disabled:cursor-not-allowed'
                                                    onClick={() => onRoomChange(ADD_ROOM, index, null, null)}
                                                >
                                                    Add New Cabin
                                                    <img className={`h-6 ml-1 ${checkCabinCount(cabinData) ? 'opacity-40' : ''}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/add-cabin-icon.svg" alt="" />
                                                </button>
                                                : null
                                            }
                                        </div>
                                        <div className='grid grid-cols-3 gap-2 lg:gap-4 px-2 lg:px-4 py-4'>
                                            <div>
                                                <p className='text-sm lg:text-lg mb-1'>Adults</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-4'>12 Years & Above</p>
                                                <CountDropdown cabin={cabin.code} add={ADD_ADULT} type={val.adults} index={index} maxCapacity={cabin.max_capacity} onPaxChange={(val: any) => onRoomChange(ADD_ADULT, index, roomIndex, val)} />
                                            </div>
                                            <div>
                                                <p className='text-sm lg:text-lg mb-1'>Children</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-4'>2 Years - 12 Years</p>
                                                <CountDropdown disabled={!isAdultSelected(val)} cabin={cabin.code} add={ADD_CHILDREN} type={val.children} index={index} maxCapacity={cabin.max_capacity - 1} onPaxChange={(val: any) => onRoomChange(ADD_CHILDREN, index, roomIndex, val)} />
                                            </div>
                                            <div>
                                                <p className='text-sm lg:text-lg mb-1'>Infant</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-4'>1 Year - 2 Years</p>
                                                <CountDropdown disabled={!isAdultSelected(val)} cabin={cabin.code} add={ADD_INFANT} type={val.infants} index={index} maxCapacity={cabin.max_capacity - 1} onPaxChange={(val: any) => onRoomChange(ADD_INFANT, index, roomIndex, val)} />
                                            </div>
                                        </div>
                                        {cabin.rooms.length == roomIndex + 1 ?
                                            <div className='flex justify-end px-4 py-4 border-t border-gray-300'>
                                                <div className='cursor-pointer flex items-center' onClick={() => onRoomChange(REMOVE_ROOM, index, roomIndex, null)}>
                                                    <img className='h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/images/cabin-delete-icon.svg" alt="" />
                                                    <p className='text-xs lg:text-sm font-light'>Remove Cabin</p>
                                                </div>
                                            </div>
                                            : null
                                        }
                                    </div>
                                    {CabinError(cabin.code, val.seq_no)}
                                </>
                            )
                        })}
                    </>
                    : null
                }
            </div>
        )
    }

    const proceedToOffers = () => {
        let upg = false;
        setNextLoading(true)
        const _payload: any = {
            id: itineraryData?.id,
            data: {
                itinerary: itineraryData,
                rooms: selectedRooms,
                website: getRefUrl()
            }
        };
        const names = store?.itinerary?.ports
            .filter((item: any) => item.name !== "At Sea")
            .map((item: any, index: any, arr: any) => {
                const isLast = index === arr.length - 1;
                const name = isLast ? item.name : item.name + ` - `;
                return index === 0 || isLast ? name : name;
            })
            .join(" ");
        let totalFare = 0;
        let itemData = selectedRooms?.map((v: any) => {
            totalFare = totalFare + v.category_details.total;
            return {
                item_id: store?.itinerary?.itinerary_id,
                item_name: names,
                item_category: store?.itinerary?.nights + ' nights',
                item_category2: store?.itinerary?.start_date,
                item_category3: v.category_details.code,
                item_list_name: v.category_details.name,
                item_variant: 'cabin',
                price: v.category_details.total,
            }
        })
        getUpgrade(_payload)
            .unwrap()
            .then((res: any) => {
                SaveStore({
                    ...store,
                    rooms: res.rooms,
                    totalCabinFare: res.total,
                    actualTotalCabinFare: res.actual_total,
                    GAData: itemData
                });
                res.rooms.map((val: any) => {
                    if (val.upgrades.length) {
                        upg = true;
                    }
                })
                setNextLoading(false)
                if (!upg) {
                    navigate('/cabin')
                } else {
                    navigate('/upgradeRoom', { state: { upgrade: res } })
                }
            })
            .catch((res: any) => {
                console.log('Error: ', res)
            })
    };

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setSortBy(false)
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    });

    const sortByFilter = (e: any) => {
        let newCabinData = [...cabinData]
        if (e == 'highToLow') {
            newCabinData.sort((a: any, b: any) => {
                if (a.per_guest === 0) return 1;
                if (b.per_guest === 0) return -1;
                return b.per_guest - a.per_guest;
            });
            selectedSortBy('highToLow')
            // newCabinData = newCabinData.sort((a:any, b:any) => b.per_guest - a.per_guest);
        } else if (e == 'lowToHigh') {
            newCabinData.sort((a: any, b: any) => {
                if (a.per_guest === 0) return 1;
                if (b.per_guest === 0) return -1;
                return a.per_guest - b.per_guest;
            });
            selectedSortBy('lowToHigh')
            // newCabinData = newCabinData.sort((a:any, b:any) => a.per_guest - b.per_guest);
        }
        setCabinData(newCabinData)
    }

    const showPopup = () => {
        setPopupVisible(true);
    };

    const hidePopup = () => {
        setPopupVisible(false);
    };

    const handleMouseLeave = (event: any) => {
        if (
            popupRef.current &&
            !popupRef.current.contains(event.relatedTarget)
        ) {
            hidePopup();
        }
    };

    const portList = itineraryData?.ports
        .filter((val: any) => val.name !== 'At Sea')
        .map((val: any) => val.name)
        .join(' | ');

    const isLong = portList?.length > 150;

    return (
        <>
            <Header />
            {isLoading || isLoading1 ?
                <div className='h-full w-full flex justify-center items-center overflow-hidden fixed bg-black/30 z-50'>
                    <img
                        className='w-32 lg:w-44'
                        src="/assets/images/cordelia-new-loader.gif"
                        alt=""
                    />
                </div>
                : null
            }
            <main className='pt-[40px] pb-24 lg:pt-[78px] lg:pb-16'>
                <div className='container mx-auto px-4 lg:px-9 mt-8'>
                    <div>
                        <div className='grid grid-cols-3 gap-6'>
                            <div className="col-span-3 lg:col-span-2 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className='flex items-center'>
                                        <img
                                            src="https://images.cordeliacruises.com/cordelia_v2/public/assets/back-arrow-icon.svg"
                                            alt="arrow"
                                            onClick={() => {
                                                if (location.key == 'default') {
                                                    navigate('/upcoming-cruises')
                                                } else {
                                                    navigate(-1)
                                                }
                                            }}
                                            className={`mr-2 h-4 cursor-pointer`}
                                        />
                                        <h1 className="text-lg font-semibold lg:text-xl">
                                            Select Cabin
                                        </h1>
                                    </div>
                                    <div className='cursor-pointer relative py-2'
                                        onMouseEnter={showPopup}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className='flex items-center'>
                                            <p className='text-lg font-bold mr-2'>Sort by</p>
                                            <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/sort-by-new-icon.svg" alt="" />
                                        </div>
                                        {isPopupVisible ?
                                            <div
                                                ref={popupRef}
                                                onMouseLeave={hidePopup}
                                                className='absolute bg-white w-[220px] shadow-allSide rounded-lg border border-gray-300/50 top-10 z-50 right-0 lg:left-0'
                                            >
                                                <div className='flex items-center cursor-pointer px-4 hover:bg-gray-100/5 py-3' onClick={() => {
                                                    sortByFilter('highToLow')
                                                    handleMouseLeave
                                                    setPopupVisible(false)
                                                }}>
                                                    <div className='w-[30px]'>
                                                        {SelectedSortBy == 'highToLow' ?
                                                            <img className='h-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/tick-icon.svg" alt="" />
                                                            : null
                                                        }
                                                    </div>
                                                    {/* <input className='mr-2 cursor-pointer text-brand-primary' type="checkbox" name="" checked={SelectedSortBy == 'highToLow' ? true : false} id="" /> */}
                                                    <p>Price - high to low</p>
                                                </div>
                                                <div className='border-t border-gray-300' />
                                                <div className='flex items-center cursor-pointer px-4 hover:bg-gray-100/5 py-3' onClick={() => {
                                                    sortByFilter('lowToHigh')
                                                    handleMouseLeave
                                                    setPopupVisible(false)
                                                }}>
                                                    <div className='w-[30px]'>
                                                        {SelectedSortBy == 'lowToHigh' ?
                                                            <img className='h-3' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/tick-icon.svg" alt="" />
                                                            : null
                                                        }
                                                    </div>
                                                    {/* <input className='mr-2 cursor-pointer text-brand-primary' type="checkbox" name="" checked={SelectedSortBy == 'lowToHigh' ? true : false} id="" /> */}
                                                    <p>Price - low to high</p>
                                                </div>
                                            </div>
                                            : null
                                        }
                                    </div>
                                </div>
                                {cabinData && cabinData?.map((val: any, i: any) => (
                                    <CabinCard cabin={val} index={i} maxCapacity={val?.max_capacity} />
                                ))}
                            </div>

                            <div className='hidden lg:block'>
                                <div className='fixed lg:sticky top-[166px] pb-4'>
                                    <div className='border-gray-400 shadow-allSide rounded-lg mb-4 px-4'>
                                        {/* <div className='flex flex-wrap py-6'>
                                            {itineraryData?.ports.map((val: any, i: any) => {
                                                if (val.name != 'At Sea')
                                                    return (
                                                        <p className='text-base font-bold'>{val.name}{itineraryData.ports.length != (i + 1) ? <span>-</span> : null} </p>
                                                    )
                                            })}
                                            {itineraryData?.nights < 5 ? (
                                                itineraryData?.ports
                                                    .filter((val: any) => val.name !== 'At Sea')
                                                    .map((val: any, i: number, arr: any[]) => (
                                                        <p key={i} className="text-base font-bold">
                                                            {val.name}
                                                            {i !== arr.length - 1 && <span> - </span>}
                                                        </p>
                                                    ))
                                            ) : (
                                                <>
                                                    {itineraryData?.ports[0]?.name !== 'At Sea' && (
                                                        <p className="text-base font-bold">{itineraryData?.ports[0]?.name} - </p>
                                                    )}
                                                    {itineraryData?.ports[itineraryData?.ports.length - 1]?.name !== 'At Sea' && (
                                                        <p className="text-base font-bold">{itineraryData?.ports[itineraryData?.ports.length - 1]?.name}</p>
                                                    )}
                                                </>
                                            )}
                                            <p className='text-base font-bold text-brand-primary ml-1'>({itineraryData?.nights}N/{itineraryData?.nights + 1}D)</p>
                                        </div>
                                        <div className='border-t border-gray-300 w-full' /> */}
                                        <div className='flex items-start justify-between py-6'>
                                            <div className='text-center'>
                                                <p className='text-xs lg:text-base  font-bold'>
                                                    {itineraryData?.ports[0]?.name}
                                                </p>
                                                <p className='text-xs text-gray-100 font-semibold'>
                                                    {moment(itineraryData?.start_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                                </p>
                                                <p className='text-xs text-gray-100 font-semibold'>
                                                    {departure}
                                                </p>
                                            </div>
                                            <div className='w-[30%] text-center relative -mt-[5px] lg:-mt-[3px]'>
                                                <p className='text-gray-200 whitespace-nowrap overflow-hidden'>-------------</p>
                                                <img className='absolute h-7'
                                                    style={{
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                    src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cruise-icon.svg" alt=""
                                                />
                                            </div>
                                            <div className='text-center'>
                                                <p className='text-xs lg:text-base  font-bold'>
                                                    {itineraryData?.ports[itineraryData?.ports.length - 1]?.name}
                                                </p>
                                                <p className='text-xs text-gray-100 font-semibold'>
                                                    {moment(itineraryData?.end_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                                </p>
                                                <p className='text-xs text-gray-100 font-semibold'>
                                                    {arrival}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='border-t border-gray-300 w-full' />
                                        <div className='flex flex-col items-start py-6'>
                                            <p className="text-xs lg:text-sm font-medium text-gray-100">
                                                Visiting Ports:
                                            </p>
                                            <div className="">
                                                <span
                                                    className={`text-xs lg:text-sm font-medium !leading-5`}
                                                >
                                                    <span className="text-xs lg:text-sm font-medium !leading-5">
                                                        {isLong && !isExpanded ? portList?.slice(0, 65) + '...' : portList}
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
                                            {/* <div className="flex flex-wrap">
                                                {itineraryData?.ports.map((val: any, i: any) => {
                                                    if (val.name != 'At Sea')
                                                        return (
                                                            <div>
                                                                <p className="text-xs lg:text-sm font-medium">
                                                                    {val.name}{' '}
                                                                    {itineraryData.ports.length != i + 1 ? (
                                                                        <span>| </span>
                                                                    ) : null}
                                                                </p>
                                                            </div>
                                                        );
                                                })}
                                            </div> */}
                                        </div>
                                        {selectedCabinDetail && totalPrice && totalGuest ? (
                                            <>
                                                <div className='border-t border-gray-300 w-full' />
                                                <div className='flex py-6 justify-between'>
                                                    <div className='w-[180px]'>
                                                        <div className='flex items-center'>
                                                            <div className='w-[40px] flex items-center justify-center'>
                                                                <img className='mr-2 w-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/room-icon.svg" alt="" />
                                                            </div>
                                                            <p className='text-sm font-semibold'>{selectedCabinDetail.length} Cabin</p>
                                                        </div>
                                                        <div className='flex items-center'>
                                                            <div className='w-[40px] flex items-center justify-center'>
                                                                <img className='mr-2 w-6' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/guests-icon.svg" alt="" />
                                                            </div>
                                                            <p className='text-sm font-semibold'>{totalGuest} Guests</p>
                                                        </div>
                                                    </div>
                                                    <div className='text-right'>
                                                        <div className='flex items-center justify-end'>
                                                            {itineraryData?.discount_pct != 0 ? <p className='text-xs text-gray-100 font-semibold line-through mr-2'>₹{FormatAmount(actualTotalPrice)}</p> : null}
                                                            <p className='text-xl font-bold'>₹{FormatAmount(totalPrice)}</p>
                                                        </div>
                                                        <p className='text-xs text-gray-100 mt-1'>Excl. GST charges</p>
                                                        {itineraryData?.discount_pct != 0 ?
                                                            <div className='flex items-center mt-1 justify-end'>
                                                                <img className='h-3 mr-1' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offer-upcoming-icon.svg" alt="" />
                                                                <p className='text-xs text-brand-green font-medium'>Discount Applied</p>
                                                            </div>
                                                            : null
                                                        }
                                                    </div>
                                                </div>
                                                {cabinDetail ? (
                                                    <>
                                                        <div className='border-t border-gray-300 w-full' />
                                                        <div className='py-4'>
                                                            {selectedCabinDetail?.map((val: any, i: number) => (
                                                                <div className='flex items-center'>
                                                                    <p className='text-sm font-semibold'>Cabin {i + 1}:</p>
                                                                    <p className='text-xs text-gray-100 ml-2'>{val?.totalGuest} Guests</p>
                                                                    <p className='text-xs text-gray-100 mx-1'>|</p>
                                                                    <p className='text-xs text-gray-100'>{val?.cabinName}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : null}
                                                <div className='border-t border-gray-300 w-full' />
                                                <div onClick={() => setCabinDetail(!cabinDetail)} className='py-4 flex cursor-pointer items-center'>
                                                    <p className='text-sm text-brand-blue-2 font-semibold text-center cursor-pointer'>{cabinDetail ? 'Hide Cabin Details' : 'View Cabin Details'}</p>
                                                    <img className={`h-2 ml-2 ${cabinDetail ? 'rotate-180' : ''}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-upcoming-icon.svg" alt="" />
                                                </div>
                                            </>
                                        ) : null}
                                    </div>

                                    {cabinLimitExceed ?
                                        <div className='bg-danger/5 pl-4 pr-4 py-4 mb-4 rounded shadow-allSide border border-danger/5'>
                                            <div className='flex items-start'>
                                                <img className='mt-1 mr-3 hidden lg:block' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/note-icon.svg" alt="" />
                                                <div>
                                                    <p className='text-sm lg:text-base font-semibold lg:font-bold mb-1'>Important Note:</p>
                                                    <p className='text-xs lg:text-sm text-gray-100 italic'>User can only book 4 cabins, and if you want to book more, you'll need to <span className='font-semibold italic'> contact: 022-68811111</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        : null
                                    }
                                    {selectedCabinDetail && totalPrice && totalGuest ? (
                                        // <button disabled={checkCabinSelect(cabinData)} onClick={() => proceedToOffers()} className='mt-4 bg-brand-primary text-center py-2.5 rounded cursor-pointer disabled:bg-brand-primary/30 w-full'>
                                        //     <p className='text-white font-semibold'>Proceed</p>
                                        // </button>
                                        <Button text='Proceed' disabled={checkCabinSelect(cabinData)} handleClick={() => proceedToOffers()} className='w-full' />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {selectedCabinDetail && totalPrice && totalGuest ? (
                <div className='fixed w-full bottom-0 bg-white z-[29] lg:hidden shadow-[rgba(0,0,0,0.14)_5px_-2px_5px]'>
                    <div className='bg-brand-blue/10 px-6 py-1.5 flex justify-between items-center' onClick={() => setCabinDetail(!cabinDetail)}>
                        <p className='text-xxs text-brand-blue-2 font-semibold'>{selectedCabinDetail.length} Cabin - {totalGuest} Guests</p>
                        <img className={`h-2 ml-2 ${cabinDetail ? '' : 'rotate-[270deg]'}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-upcoming-icon.svg" alt="" />
                    </div>
                    {cabinDetail ? (
                        <>
                            <div className='py-2 px-6'>
                                {selectedCabinDetail?.map((val: any, i: number) => (
                                    <div className='flex items-center'>
                                        <p className='text-sm font-semibold'>Cabin {i + 1}:</p>
                                        <p className='text-xs text-gray-100 ml-2'>{val?.totalGuest} Guests</p>
                                        <p className='text-xs text-gray-100 mx-1'>|</p>
                                        <p className='text-xs text-gray-100'>{val?.cabinName}</p>
                                    </div>
                                ))}
                            </div>
                            <div className='border-t border-gray-300 w-full' />
                        </>
                    ) : null}
                    <div className='bg-white px-6 py-2 '>
                        <div className='flex justify-between items-center mb-1'>
                            <div>
                                <div className='flex items-center'>
                                    <p className='text-lg font-bold'>₹{FormatAmount(totalPrice)}</p>
                                    {itineraryData?.discount_pct != 0 ? <p className='text-xxs text-gray-100 line-through ml-2'>₹{FormatAmount(actualTotalPrice)}</p> : null}
                                </div>
                                <p className='text-xxs text-gray-100'>Excl. GST charges</p>
                                {itineraryData?.discount_pct != 0 ?
                                    <div className='flex items-center mt-1'>
                                        <img className='h-3 mr-1' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offer-upcoming-icon.svg" alt="" />
                                        <p className='text-xxs text-brand-green'>Discount Applied</p>
                                    </div>
                                    : null
                                }
                            </div>
                            <div className=''>
                                <Button text='Proceed' size='sm' disabled={checkCabinSelect(cabinData)} handleClick={() => proceedToOffers()} className='w-full' />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <Modal show={amenitiesModal} align={'center'} mainClassName="!items-end lg:items-center" className="w-full lg:w-3/4 center overflow-hidden left-0 right-0 lg:m-auto top-0 bottom-0 h-[90%] max-h-[540px] relative" onClose={() => {
                setAmenitiesModal(false)
                setActiveAmenities('')
            }}>
                <div className='flex items-center justify-center p-4 pb-0 absolute right-3 top-0'>
                    <p className='text-base lg:text-xl font-bold cursor-pointer' onClick={() => {
                        setAmenitiesModal(false)
                        setActiveAmenities('')
                    }}>X</p>
                </div>
                {amenitiesData && amenitiesData?.name &&
                    <div className='overflow-scroll no-scrollbar h-full  px-2 lg:px-6 py-2 lg:py-6 text-center bg-white flex rounded'>
                        <div className='w-[50%] hidden lg:block'>
                            <ImageGallery
                                items={amenitiesData?.imageArr}
                                showFullscreenButton={false}
                                showPlayButton={false}
                                autoPlay={true}
                                slideInterval={5000}
                                thumbnailPosition={'bottom'}
                                startIndex={0}
                                lazyLoad={true}
                            />
                        </div>
                        <div className='w-full lg:w-[50%] '>
                            <div className='text-left pl-2 lg:pl-6 py-2 lg:py-6'>
                                <p className='text-lg lg:text-2xl font-semibold font-outfit'>{amenitiesData?.name}</p>
                                <p className='font-outfit mt-2 lg:mt-2 text-xs lg:text-[0.94rem] lg:leading-6 text-gray-600'>{amenitiesData?.subtitle}</p>
                                <div className='w-full mt-3 lg:hidden'>
                                    <ImageGallery
                                        items={amenitiesData?.imageArr}
                                        showFullscreenButton={false}
                                        showPlayButton={false}
                                        autoPlay={true}
                                        slideInterval={5000}
                                        startIndex={0}
                                        lazyLoad={true}
                                        showThumbnails={false}
                                    />
                                </div>
                                <p className='text-base lg:text-xl font-semibold font-outfit mt-3 lg:mt-4'>Amenities</p>
                                <div className='grid grid-cols-1 mt-2 items-start max-h-[230px] overflow-y-scroll'>
                                    {amenitiesData?.itinerary?.map((item: any) => {
                                        return (
                                            <div className='flex items-start mb-1.5'>
                                                <img className='h-4 lg:h-6 w-4 lg:w-6 mr-1 lg:mr-2' src={item.icon} alt="" />
                                                <p className='text-xxs lg:text-sm font-outfit font-normal'>{item.title}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                                {amenitiesData.note &&
                                    <div>
                                        <p className='font-outfit mt-2 lg:mt-3 text-xs lg:text-base lg:leading-7 text-gray-600'><span className='text-brand-primary font-semibold'>Note: </span>{amenitiesData.note}</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </Modal>

            <ProfileAuth setAuthModal={setShowPhoneModal} token={token} setToken={setToken} authModal={showPhoneModal} />

            <Modal show={readMoreModal} align={'center'} className=" w-full lg:w-[40%] center overflow-hidden left-0 right-0 m-auto top-0 bottom-0 relative" onClose={() => {
                setReadMoreModal(false)
            }}>
                <div className='flex items-center justify-center p-4 pb-0 absolute right-3 top-0'>
                    <p className='text-base lg:text-xl font-bold cursor-pointer' onClick={() => {
                        setReadMoreModal(false)
                    }}>X</p>
                </div>
                <div className='overflow-scroll no-scrollbar px-2 lg:px-6 py-2 lg:py-6 bg-white flex rounded'>
                    <div className='py-8 px-6'>
                        <p>{readMoreContent}</p>
                    </div>
                </div>
            </Modal>
            {cabinLimitExceed ?
                <div className='lg:hidden fixed bottom-0 px-4 z-[30]'>
                    <div className='w-full bg-[#fdf1ee] pl-4 pr-4 py-4 mb-4 rounded shadow-allSide border border-danger/5 relative'>
                        <div className='absolute top-[-8px] right-[-5px] h-[20px] w-[20px] flex items-center justify-center bg-white rounded-full' onClick={() => setCabinLimitExceed(false)}>
                            <p className='leading-[1]'>x</p>
                        </div>
                        <div className='flex items-start'>
                            <img className='mt-1 mr-3 hidden lg:block' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/note-icon.svg" alt="" />
                            <div>
                                <p className='text-sm lg:text-base font-semibold lg:font-bold mb-1'>Important Note:</p>
                                <p className='text-xs lg:text-sm text-gray-100 italic'>User can only book 4 cabins, and if you want to book more, you'll need to <span className='font-semibold italic'> contact: 022-68811111</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                : null
            }
        </>
    );
}