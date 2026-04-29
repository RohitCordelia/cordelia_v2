import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import moment from 'moment';
import { useGetViewItineraryMutation, useAvailableCabinMutation, useCabinPricingMutation } from '../../services/upcomingCruise/upcomingCruise';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../../components/UI/ModalCenter';
import { ADD_ADULT, ADD_CHILDREN, ADD_INFANT, ADD_ROOM, REMOVE_ROOM } from '../../constants/itineraryConstants';
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { GetStore, SaveStore, GetContact } from '../../utils/store/store';
import { useGetUpgradeMutation, useGetOffersMutation, useCreateBookingMutation } from '../../services/itinerary/itinerary'
import { checkCabinCount, checkCabinSelect, isAdultSelected } from '../..//utils/rooms/room';
import { getRefUrl } from '../../utils/user/user';
import { FormatAmount } from '../../../src/utils/formatter/formatter';
import './index.css'
import Header from "../../components/Header/header";
import Button from '../../components/UI/Button';
import { CabinBedIcon, Calendar, GuestsIcon } from '../../components/Icon';
import BottomSheet from '../../component/BottomSheet';
import { CheckDevice } from '../../utils/deviceType/device';
import { GetAuth } from "../../utils/store/store";
import ProfileAuthV2 from '../profile/authV2';
import { useCreateCouponMutation } from '../../services/cms/cms';
import SpeakExpert from '../../component/SpeakExpert';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import IdleModal from '../../component/IdleModal';
import UpcHeader from './component/upcHeader';
import { ANALYTICS_EVENTS, trackCustomEvent } from '../../services/analytics';
import CallbackSide from './component/callbackSide';
import RequestCallbackModal from '../../component/RequestCallbackModal';
import EMICard from '../../component/EMICard'
import CruiseChatbot from '../../components/chatbot/CruiseChatbot';
import { CabinSelection, CabinTypeSelection } from '../../components/chatbot/types';

type Props = {}

const CABINS = [
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
                'title': 'Sofa sitting area',
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
        'note': 'No sofa sitting area in 7186, 7188, 7686, 7688, 7690, 8686, 9684 cabins.'
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

const randomString = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const generateCouponCode = () => {
    const cc = `CORD4${randomString(7)}`;
    return cc;
};

const safeFormatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';

    const match = timeStr.match(/(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm))/);
    if (match) return match[1].toUpperCase();

    const m = moment(timeStr, ['ddd, DD MMM hh:mm A', 'ddd, DD MMM, hh:mm A', 'YYYY-MM-DD h:mm A', 'DD/MM/YYYY hh:mm A', 'hh:mm A']);
    if (m.isValid()) return m.format('hh:mm A');

    return 'N/A';
};

export default function SelectCabin({ }: any) {
    const store = GetStore();
    const ref = useRef<HTMLInputElement>(null);

    const [getViewItinerary] = useGetViewItineraryMutation()
    const [availableCabinMutation] = useAvailableCabinMutation()
    const [cabinPricing] = useCabinPricingMutation()
    const [getUpgrade] = useGetUpgradeMutation();
    const [getOffers] = useGetOffersMutation();
    const [createBooking] = useCreateBookingMutation();
    const [createCoupon, { isLoading: loadingCreate }] = useCreateCouponMutation();

    let navigate = useNavigate()
    const itineraryId = new window.URLSearchParams(window.location.search).get('id');

    const [isLoading, setIsLoading] = useState<any>();
    const [isLoading1, setIsLoading1] = useState<any>();
    const [itineraryData, setItineraryData] = useState<any>();
    const [cabinData, setCabinData] = useState<any>();
    const [selectedCabinData, setSelectedCabinData] = useState<any>([]);
    const [amenitiesModal, setAmenitiesModal] = useState<any>(false);
    const [activeAmenities, setActiveAmenities] = useState<any>();
    const [amenitiesData, setAmenitiesData] = useState<any>([]);
    const [selectedCabinDetail, setSelectedCabinDetail] = useState<any>([]);
    const [totalGuest, setTotalGuest] = useState<any>();
    const [totalPrice, setTotalPrice] = useState<any>();
    const [actualTotalPrice, setActualTotalPrice] = useState<any>();
    const [cabinDetail, setCabinDetail] = useState<any>(false);
    const [nextLoading, setNextLoading] = useState<any>(false);
    const [selectedRooms, setSelectedRooms] = useState<any>();
    const [readMoreModal, setReadMoreModal] = useState<any>();
    const [readMoreContent, setReadMoreContent] = useState<any>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [token, setToken] = useState('');
    const [authModal, setAuthModal] = useState(false);
    const [couponModal, setCouponModal] = useState(false)
    const [couponData, setCouponData] = useState({ per: 0, cc: '' })
    const [couponCopied, setCouponCopied] = useState(false);
    const [showRequestACallback, setShowRequestACallback] = useState(false);
    const [pageCode, setPageCode] = useState('');
    const [open, setOpen] = useState(false);

    const [cabinLimitExceed, setCabinLimitExceed] = useState(false);
    const cabinRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const isCabinViewedRef = useRef(false);

    const embarkationDate = moment(itineraryData?.start_date, 'DD/MM/YYYY');
    const disembarkationDate = moment(itineraryData?.end_date, 'DD/MM/YYYY');

    const rawEmbarkationTime = itineraryData?.ports?.[0]?.embarkation_start_time || itineraryData?.ports?.[0]?.embarkation_start_time;
    const rawDisembarkationTime = itineraryData?.ports?.[itineraryData?.ports?.length - 1]?.arrival;

    const embarkationFormattedTime = rawEmbarkationTime ? moment(rawEmbarkationTime, ['YYYY-MM-DD h:mm A']).format('hh:mm A') : 'N/A';
    const disembarkationFormattedTime = safeFormatTime(rawDisembarkationTime);

    const location = useLocation();

    const { cta } = location.state || {};

    const idle = useIdleTimer();

    const emiAmount = FormatAmount(Math.round(totalPrice / 9));

    const chatbotAvailableCabins = useMemo(() => {
        if (!cabinData) return [];
        return cabinData.map((c: any) => ({
            name: c.name,
            code: c.code,
            per_guest: c.per_guest,
            max_capacity: c.max_capacity,
            is_sold: !!c.is_sold,
            // Pass current room selection so Nyra knows the existing state
            selected_rooms: c.rooms ? c.rooms.map((r: any) => ({
                adults: r.adults,
                children: r.children,
                infants: r.infants,
            })) : undefined,
        }));
    }, [cabinData]);

    const handleChatbotCabinSelect = useCallback((selection: CabinSelection) => {
        if (!cabinData) return;

        // Build a map of cabin_type → rooms from the selection
        const selectionMap = new Map<string, CabinTypeSelection['rooms']>(
            selection.cabins.map((s: CabinTypeSelection) => [s.cabin_type.toLowerCase(), s.rooms])
        );

        // Apply the complete new state: update matched cabins, clear unmentioned ones
        const newCabinData = cabinData.map((c: any) => {
            // Find match by name (partial, case-insensitive both ways)
            const matchKey = [...selectionMap.keys()].find(key =>
                c.name?.toLowerCase().includes(key) || key.includes(c.name?.toLowerCase())
            );

            if (matchKey) {
                const rooms = selectionMap.get(matchKey)!;
                return {
                    ...c,
                    rooms: rooms.map((r: CabinTypeSelection['rooms'][number], ri: number) => ({
                        adults: r.adults,
                        children: r.children,
                        infants: r.infants,
                        seq_no: ri + 1,
                    })),
                };
            }
            // Clear cabins not in the new selection (remove their rooms key)
            const { rooms: _removed, ...rest } = c;
            return rest;
        });

        setCabinData(newCabinData);

        // Build pricing payload from only cabins that have rooms
        const payload = newCabinData
            .filter((c: any) => c.rooms?.length)
            .map((c: any) => ({ category_code: c.code, rooms: c.rooms }));

        if (!payload.length) return;

        const hasEmpty = payload.some((c: any) =>
            c.rooms.some((r: any) => (r.adults + r.children + r.infants) === 0)
        );
        if (hasEmpty) return;

        cabinPricing({ itinerary_id: itineraryId, data: payload })
            .unwrap()
            .then((res: any) => {
                const mapped = res?.pricings?.map((item: any) => {
                    const { pricings, ...rest } = item;
                    return { ...rest, category_details: Array.isArray(pricings) ? pricings[0] : null, selected: pricings[0]?.code, error: Array.isArray(pricings) ? null : pricings };
                });
                let totalP = 0, actualP = 0, totalG = 0, cabinDetail: any[] = [];
                for (const group of res.pricings) {
                    totalG += (group.adults + group.children + group.infants);
                    for (const p of group.pricings) { totalP += p.total; actualP += p.actual_total; }
                    cabinDetail.push({ cabinName: group.pricings[0].name, adult: group.adults, children: group.children, infant: group.infants, totalGuest: group.adults + group.children + group.infants });
                }
                setSelectedRooms(mapped);
                setSelectedCabinDetail(cabinDetail);
                setTotalGuest(totalG);
                setTotalPrice(totalP);
                setActualTotalPrice(actualP);
            })
            .catch(console.error);
    }, [cabinData, cabinPricing, itineraryId]);

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (itineraryData && cabinData?.length > 0 && !isCabinViewedRef.current) {
            trackCustomEvent(ANALYTICS_EVENTS.CABINS_VIEWED, {
                page_url: window.location.href,
                visiting_ports: portList,
                destination_name: itineraryData?.destination_port?.name,
                no_of_nights: itineraryData?.nights,
                cruise_name: itineraryData?.ship?.name,
                trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                price_starting_from: itineraryData?.starting_fare,
                embarkation_time: embarkationFormattedTime,
                disembarkation_time: disembarkationFormattedTime,
                embarkation_date: embarkationDate?.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                disembarkation_date: disembarkationDate?.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
                shore_excursion_available: itineraryData?.shore_excursions,
                itinerary_id: itineraryData?.id,
                itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                no_of_cabins: cabinData?.filter((cabin: any) => !cabin?.is_sold).length,
                cta: cta || 'Book Now',
            });

            trackCustomEvent(ANALYTICS_EVENTS.BOOKING_STARTED, {
                page_url: window.location.href,
                visiting_ports: portList,
                destination_name: itineraryData?.destination_port?.name,
                no_of_nights: itineraryData?.nights,
                cruise_name: itineraryData?.ship?.name,
                trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                embarkation_time: embarkationFormattedTime,
                disembarkation_time: disembarkationFormattedTime,
                embarkation_date: embarkationDate?.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                disembarkation_date: disembarkationDate?.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
                shore_excursion_available: itineraryData?.shore_excursions,
                itinerary_id: itineraryData?.id,
                itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                origin_port: itineraryData?.starting_port?.name,
                arrival_port: itineraryData?.destination_port?.name,
                // cabin_id: selectedRooms?.map((v: any) => v?.category_details?.id).join(','),
                // cabin_name: selectedRooms?.map((v: any) => v?.category_details?.name).join(','),
                // amenities: Array.from(new Set(selectedCabinData?.map((v: any) => v?.amenities?.map((a: any) => a?.name).join(',')))).join(','),
                // max_capacity: selectedCabinData?.map((v: any) => v?.is_sold ? v?.code == 'ROYALSUITE' || v?.code == 'BALCONYSUITE' || v?.code == 'SUITE' ? '3 guests' : '4 guests' : `${v?.max_capacity} guests`).join(','),
                // available_decks: selectedRooms?.map((v: any) => v?.category_details?.decks).join(','),
                // cabin_details: selectedRooms?.map((v: any) => {return {adults: v?.adults, children: v?.children, infants: v?.infants, cabin_id: v?.category_details?.id}}),
                // total_fare: selectedRooms?.reduce((acc: any, v: any) => acc + v?.category_details?.total, 0),
            });
            isCabinViewedRef.current = true;
        }
    }, [itineraryData, cabinData]);

    useEffect(() => {
        setToken(GetAuth()?.token)
    }, [GetAuth()]);

    useEffect(() => {
        const selectedCabinData1 = cabinData?.filter((cabin: any) =>
            selectedCabinDetail?.some((detail: any) => detail?.cabinName === cabin?.name)
        );
        setSelectedCabinData(selectedCabinData1);
    }, [cabinData, selectedCabinDetail]);

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

                setCabinData(sortedRes);
                SaveStore({ ...store, cabinData: sortedRes });
                setIsLoading1(false);
                window.scrollTo({ top: 0, left: 0 });
            })
            .catch((res: any) => {
                setIsLoading1(false);
                console.error("Error:", res);
            });
    }, [])

    const handleOpenReqCallback = (type: string) => {
        setShowRequestACallback(true);
        setPageCode(type);
    }

    // const arrival = itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival;
    const arrival = `${itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival.split(',')[0]}, ${itineraryData?.ports[itineraryData?.ports.length - 1]?.arrival.split(' ').slice(-2).join(' ')}`;
    // const departure = itineraryData?.ports[0]?.departure;
    const departure = `${itineraryData?.ports[0]?.departure.split(',')[0]}, ${itineraryData?.ports[0]?.departure.split(' ').slice(-2).join(' ')}`;

    useEffect(() => {
        if (activeAmenities) {
            let a = CABINS.find((item) => item.code == activeAmenities);
            if (a) {
                setAmenitiesModal(true)
                setAmenitiesData(a);
            }
        }
    }, [activeAmenities])

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
            <div className='rounded mt-3'>
                <Listbox disabled={disabled} value={type} onChange={onPaxChange}>
                    <ListboxButton className={`border  ${disabled ? 'bg-gray-100/10' : ''} border-gray-300 w-full px-4 flex items-center text-sm lg:text-lg  py-2 justify-between rounded`}>
                        {type}
                        <img className={`h-1.5 lg:h-2`} src="https://www.cordeliacruises.com/assets/icons/footer/chevon-down-black.svg" alt="" />
                    </ListboxButton>
                    <ListboxOptions modal={false} anchor="bottom" className={`w-[var(--button-width)] focus:outline-none transition duration-100 ease-in`}>
                        {count?.slice(0, maxCapacity + 1).map((person: any) => (
                            <ListboxOption key={person?.number} value={person?.number} className="group flex cursor-pointer hover:bg-gray-300 items-center gap-2 py-1.5 px-3 select-none bg-gray-400">
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
        const newArray = cabinData.map((item: any) => {
            if (item.rooms) return {
                category_code: item.code,
                rooms: item.rooms
            }
        }).filter((item: any) => item != null);

        // Check for any room with total guests = 0
        const hasEmptyRoom = newArray?.some((cabin: any) =>
            cabin.rooms.some((room: any) => (room.adults + room.children + room.infants) === 0)
        );

        if (hasEmptyRoom) {
            console.log("Skipping price fetch — one or more rooms have 0 guests.");
            return;
        }

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
                        adult: group.adults,
                        children: group.children,
                        infant: group.infants,
                        totalGuest: (group.adults + group.children + group.infants)
                    })
                }
                setSelectedRooms(newArray)
                setSelectedCabinDetail(cabin)
                setTotalGuest(totalGuest)
                setTotalPrice(totalPrice)
                setActualTotalPrice(actualTotalPrice)
                // setSelectedRooms(JSON.parse(JSON.stringify(res.pricings)))
                SaveStore({ ...store, selectedCabinDetail: cabin });
            })
            .catch((res: any) => {
                setSelectedRooms([])
                setSelectedCabinDetail([])
                setTotalGuest('')
                setTotalPrice('')
                setActualTotalPrice('')
                console.log('Error: ', res)
            })
    }

    const onRoomChange = (type: string, index: any, roomIndex: any, val: any) => {
        const newCabinDate = [...cabinData];
        let selectedCabin = newCabinDate[index];
        let roomCount = selectedCabinDetail.length;

        switch (type) {
            case ADD_ROOM:
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

    const handleEditCabin = (cabinName: string) => {
        const element = cabinRefs.current[cabinName];
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            // optional: flash/highlight effect
            element.classList.add("ring-2", "ring-brand-primary", "rounded-md");
            setTimeout(() => {
                element.classList.remove("ring-2", "ring-brand-primary", "rounded-md");
            }, 2000);
        }
    };

    const handleRemoveCabin = (selectedIndex: number) => {
        let cabinIndex = -1;
        let roomIndex = -1;
        let counter = 0;

        for (let i = 0; i < cabinData.length; i++) {
            const cabin = cabinData[i];
            if (cabin?.rooms?.length) {
                for (let j = 0; j < cabin.rooms.length; j++) {
                    if (counter === selectedIndex) {
                        cabinIndex = i;
                        roomIndex = j;
                        break;
                    }
                    counter++;
                }
            }
            if (cabinIndex !== -1) break;
        }

        if (cabinIndex === -1 || roomIndex === -1) {
            console.warn('Unable to find cabin/room for index:', selectedIndex);
            return;
        }

        onRoomChange(REMOVE_ROOM, cabinIndex, roomIndex, null);
    };

    useEffect(() => {
        if (cabinLimitExceed) {
            const timer = setTimeout(() => {
                setCabinLimitExceed(false);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [cabinLimitExceed])

    const ChooseCabin = (index: any) => {
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
    }

    const CabinError = (cabinCode: any, seq_no: any) => {
        let newArray = selectedRooms?.filter((room: any) => room.category_code == cabinCode)
        const seqNosWithError = newArray?.filter((item: any) => item.error !== null).map((item: any) => item.seq_no);
        let a = seqNosWithError?.find((item: any) => item == seq_no)
        if (a) {
            return (
                <p className='text-danger text-xxs lg:text-sm font-medium'>No cabin available</p>
            )
        }
    }

    const CabinCard = ({ cabin, index, maxCapacity }: any) => {
        return (
            <div className={`border-gray-400 shadow-allSide rounded-lg mb-3 overflow-hidden ${cabin?.is_sold ? 'grayscale' : ''}`}>
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
                                        className='h-56 w-full cursor-pointer object-cover' alt=""
                                    />
                                </div>
                            ))}
                        </Slider>
                        {cabin?.is_sold && <div className='flex items-center gap-2 bg-danger/10 px-3 py-2'>
                            <div>
                                <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cabin-not-avaialble-error-icon.svg" alt="" className='w-5 h-5' />
                            </div>
                            <p className='text-xxs font-medium'>Cabins Not Available on this category</p>
                        </div>}
                        {/* <div className='flex items-center gap-2 bg-[#F2F2F2] p-3 -mt-1.5'>
                            <div>
                                <FireIcon className='w-4 h-4' />
                            </div>
                            <p className='text-xxs font-medium'>Only Few Cabins Left Under this cabin category</p>
                        </div> */}
                    </div>
                    <div className='col-span-5 lg:col-span-3 p-4 lg:pl-4 lg:flex lg:flex-col lg:gap-4 lg:justify-between'>
                        <div className='grid grid-cols-3'>
                            <div className='col-span-3 lg:col-span-2'>
                                <div className='flex justify-between items-center cursor-pointer' onClick={() => {
                                    setActiveAmenities(cabin?.code);
                                    let a: any = CABINS.find((item) => item.code == cabin?.code);
                                    if (a?.imageArr?.length > 0) {
                                        trackCustomEvent(ANALYTICS_EVENTS.AMENITIES_VIEWED, {
                                            page_url: window.location.href,
                                            visiting_ports: portList,
                                            destination_name: itineraryData?.destination_port?.name,
                                            no_of_nights: itineraryData?.nights,
                                            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                                            price_starting_from: itineraryData?.starting_fare,
                                            embarkation_date: embarkationDate.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            disembarkation_date: disembarkationDate.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
                                            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
                                            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                                            cabin_id: cabin?.category_id,
                                            cabin_name: cabin?.name,
                                            availability_status: !cabin?.is_sold,
                                        });
                                    }
                                }}>
                                    <p className='text-base lg:text-lg font-bold'>{cabin.name}</p>
                                    <p className='text-xs lg:hidden lg:text-sm text-brand-blue-2 underline underline-offset-2 font-semibold cursor-pointer flex items-center gap-2'>
                                        <span>
                                            <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/view_amenities.svg" alt="" />
                                        </span>
                                        View Amenities
                                    </p>
                                </div>
                                <p className='text-xs lg:text-sm mt-2 font-light text-gray-100'>
                                    {cabin?.description?.split(' ').slice(0, 6).join(' ')}...
                                    <span onClick={() => {
                                        setReadMoreModal(true)
                                        setReadMoreContent(cabin.description)
                                        trackCustomEvent(ANALYTICS_EVENTS.READ_MORE, {
                                            page_name: 'Select Cabin',
                                            page_url: window.location.href,
                                        });
                                    }} className='text-brand-primary cursor-pointer font-bold underline'> Read More</span>
                                </p>
                            </div>
                            {token && <div className='text-right hidden lg:block'>
                                {!cabin?.is_sold ?
                                    <div>
                                        {cabin.discount_pct != 0 ?
                                            <div className='flex items-center justify-start lg:justify-end'>
                                                <p className='line-through text-xs mr-1 font-medium'>₹ {FormatAmount(cabin.actual_per_guest)}</p>
                                                {/* <div className='relative'>
                                                    <img className='h-[18px]' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/offertag-booking-icon.svg" alt="" />
                                                    <p className='text-[10px] absolute top-[2px] right-[3px] text-white'>10% off</p>
                                                </div> */}
                                            </div>
                                            : null
                                        }
                                        <p className='text-xl font-bold'>₹ {FormatAmount(cabin.per_guest)}</p>
                                        <p className='text-xxs mt-1'>Per Person in Double Occupancy</p>
                                        <p className='text-xxs mt-1'>Excl. GST charges</p>
                                    </div>
                                    : null
                                }
                            </div>}
                            <div className='col-span-3 lg:flex lg:justify-between mt-2 lg:items-center'>
                                <div className='flex items-center'>
                                    <img className='h-6 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/max-capacity-icon.svg" alt="" />
                                    <p className='text-xs font-semibold'>
                                        Max Capacity:&nbsp;
                                        0{cabin?.is_sold
                                            ? cabin?.code == 'ROYALSUITE' || cabin?.code == 'BALCONYSUITE' || cabin?.code == 'SUITE' ? '3' : '4'
                                            : cabin?.max_capacity
                                        }
                                        &nbsp; Guests
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='border-t mt-2 lg:hidden border-gray-300' />
                        <div className={`flex lg:justify-between items-center mt-4 lg:mt-0 ${token ? 'justify-between' : 'justify-end'}`}>
                            <p
                                onClick={() => {
                                    setActiveAmenities(cabin?.code);
                                    let a: any = CABINS.find((item) => item.code == cabin?.code);
                                    if (a?.imageArr?.length > 0) {
                                        trackCustomEvent(ANALYTICS_EVENTS.AMENITIES_VIEWED, {
                                            page_url: window.location.href,
                                            visiting_ports: portList,
                                            destination_name: itineraryData?.destination_port?.name,
                                            no_of_nights: itineraryData?.nights,
                                            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
                                            price_starting_from: itineraryData?.starting_fare,
                                            embarkation_date: embarkationDate?.isValid() ? embarkationDate?.format('YYYY-MM-DD') : 'N/A',
                                            disembarkation_date: disembarkationDate?.isValid() ? disembarkationDate?.format('YYYY-MM-DD') : 'N/A',
                                            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
                                            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
                                            cabin_id: cabin?.category_id,
                                            cabin_name: cabin?.name,
                                            availability_status: !cabin?.is_sold,
                                        });
                                    }
                                }}
                                className='hidden lg:flex lg:gap-2 text-xs lg:text-sm text-brand-blue-2 underline underline-offset-2 font-medium cursor-pointer'
                            >
                                <span>
                                    <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/view_amenities.svg" alt="" />
                                </span>
                                View Amenities
                            </p>
                            {token && <div className='text-left lg:hidden'>
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
                                        <p className='text-xxs font-medium mt-1'>Per Person in Double Occupancy</p>
                                        <p className='text-xxs font-medium mt-1'>Excl. GST Charges</p>
                                    </div>
                                    : null
                                }
                            </div>}
                            {cabin?.is_sold ? (
                                <button
                                    // onClick={() => ChooseCabin(index)}
                                    disabled={checkCabinCount(cabinData)}
                                    className='border-1 border-gray-100 px-9 py-3 text-sm font-bold text-gray-100 bg-white rounded-full'>
                                    Sold Out
                                </button>
                            ) : cabin.rooms && cabin.rooms.length ? null :
                                <Button text='Choose Cabin' size='sm' type='secondary' disabled={checkCabinCount(cabinData)} handleClick={() => checkAuth(null, index)} className='whitespace-nowrap !rounded-full font-bold' />
                            }
                        </div>
                    </div>
                </div>
                {cabin.rooms ?
                    <>
                        {cabin.rooms.map((val: any, roomIndex: any) => {
                            return (
                                <>
                                    <div className='border border-gray-300 mt-0 lg:mt-3 mb-3 mx-1.5 lg:mx-3 rounded'>
                                        <div className='flex justify-between py-3.5 border-b border-gray-300 px-4'>
                                            <p className='text-sm lg:text-lg font-bold'>Cabin {roomIndex + 1}</p>
                                            {cabin.code != 'ROYALSUITE' && cabin.rooms.length == roomIndex + 1 ?
                                                <button
                                                    disabled={checkCabinCount(cabinData)}
                                                    className='flex items-center cursor-pointer text-xs lg:text-sm text-brand-primary font-semibold disabled:text-brand-primary/40 disabled:cursor-not-allowed'
                                                    onClick={() => onRoomChange(ADD_ROOM, index, null, null)}
                                                >
                                                    Add New Cabin
                                                    <img className={`h-6 ml-1 ${checkCabinCount(cabinData) ? 'opacity-40' : ''}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/add-cabin-icon.svg" alt="" />
                                                </button>
                                                : null
                                            }
                                        </div>
                                        <div className='grid grid-cols-3 gap-2 lg:gap-4 px-4 lg:px-4 py-5'>
                                            <div>
                                                <p className='text-xs lg:text-lg font-semibold mb-2'>Adults</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-2'>12 Years & Above</p>
                                                <CountDropdown cabin={cabin.code} add={ADD_ADULT} type={val.adults} index={index} maxCapacity={cabin.max_capacity} onPaxChange={(val: any) => onRoomChange(ADD_ADULT, index, roomIndex, val)} />
                                            </div>
                                            <div>
                                                <p className='text-xs lg:text-lg font-semibold mb-2'>Children</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-2'>2 Years - 12 Years</p>
                                                <CountDropdown disabled={!isAdultSelected(val)} cabin={cabin.code} add={ADD_CHILDREN} type={val.children} index={index} maxCapacity={cabin.max_capacity - 1} onPaxChange={(val: any) => onRoomChange(ADD_CHILDREN, index, roomIndex, val)} />
                                            </div>
                                            <div>
                                                <p className='text-xs lg:text-lg font-semibold mb-2'>Infant</p>
                                                <p className='text-xxs lg:text-base text-gray-100 font-light mb-2'>1 Year - 2 Years</p>
                                                <CountDropdown disabled={!isAdultSelected(val)} cabin={cabin.code} add={ADD_INFANT} type={val.infants} index={index} maxCapacity={cabin.max_capacity - 1} onPaxChange={(val: any) => onRoomChange(ADD_INFANT, index, roomIndex, val)} />
                                            </div>
                                        </div>
                                        {cabin.rooms.length == roomIndex + 1 ?
                                            <div className={`flex px-4 py-1.5 lg:py-3.5 border-t border-gray-300 bg-gray-400 lg:bg-white gap-3 lg:rounded ${CabinError(cabin.code, val.seq_no) === undefined ? 'justify-end' : 'justify-between'}`}>
                                                {CabinError(cabin.code, val.seq_no)}
                                                <div className='cursor-pointer flex items-center' onClick={() => onRoomChange(REMOVE_ROOM, index, roomIndex, null)}>
                                                    <img className='h-4 mr-2' src="https://images.cordeliacruises.com/cordelia_v2/public/images/cabin-delete-icon.svg" alt="" />
                                                    <p className='text-xxs lg:text-sm font-medium lg:underline'>Remove Cabin</p>
                                                </div>
                                            </div>
                                            : null
                                        }
                                    </div>
                                </>
                            )
                        })}
                    </>
                    : null
                }
            </div>
        )
    }

    const proceedToOffers = async () => {
        setNextLoading(true)

        trackCustomEvent(ANALYTICS_EVENTS.CABIN_SELECTED, {
            page_url: window.location.href,
            visiting_ports: itineraryData?.ports?.map((item: any) => item?.name).join(','),
            destination_name: itineraryData?.destination_port?.name,
            no_of_nights: itineraryData?.nights,
            cruise_name: itineraryData?.ship?.name,
            trip_type: itineraryData?.trip_type == 'round' ? 'Round Trip' : 'One Way Trip',
            embarkation_time: embarkationFormattedTime,
            disembarkation_time: disembarkationFormattedTime,
            embarkation_date: embarkationDate?.isValid() ? embarkationDate.format('YYYY-MM-DD') : 'N/A',
            disembarkation_date: disembarkationDate?.isValid() ? disembarkationDate.format('YYYY-MM-DD') : 'N/A',
            offers_available: itineraryData?.offers_available?.map((o: any) => typeof o === 'object' ? o.offer : o).join(', ') || '',
            shore_excursion_available: itineraryData?.shore_excursions,
            itinerary_id: itineraryData?.id,
            itinerary_name: itineraryData?.ports?.map((p: any) => p.name).join(' - ') || itineraryData?.alias || "",
            category_id: selectedRooms?.map((v: any) => v?.category_details?.id).join(','),
            cabin_name: selectedRooms?.map((v: any) => v?.category_details?.name).join(','),
            total_price: selectedRooms?.reduce((acc: any, v: any) => acc + v?.category_details?.total, 0),
            amenities: Array.from(new Set(selectedCabinData?.map((v: any) => v?.amenities?.map((a: any) => a?.name).join(',')))).join(','),
            max_capacity: selectedCabinData?.map((v: any) => v?.is_sold ? v?.code == 'ROYALSUITE' || v?.code == 'BALCONYSUITE' || v?.code == 'SUITE' ? '3 guests' : '4 guests' : `${v?.max_capacity} guests`).join(','),
            decks_available: selectedRooms?.map((v: any) => v?.category_details?.decks).join(','),
            cabin_details: selectedRooms?.map((v: any) => { return { adults: v?.adults, children: v?.children, infants: v?.infants, cabin_id: v?.category_details?.id } }),
            origin_port: itineraryData?.starting_port?.name,
            arrival_port: itineraryData?.destination_port?.name,
        });

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
        // First, get upgrade data to enrich room information
        const upgradePayload: any = {
            id: itineraryData?.id,
            data: {
                itinerary: itineraryData,
                rooms: selectedRooms,
                website: getRefUrl()
            }
        };
        try {
            // Call upgrade API to get complete room data with pricing_id, upgrades, etc.
            const upgradeResponse = await getUpgrade(upgradePayload).unwrap();

            // Save store with enriched room data from upgrade response
            const updatedStore = {
                ...store,
                rooms: upgradeResponse.rooms,
                totalCabinFare: upgradeResponse.total,
                actualTotalCabinFare: upgradeResponse.actual_total,
                GAData: itemData,
                itinerary: itineraryData,
            }
            SaveStore(updatedStore);
            // Prepare payload for offers API with complete store data
            const offersPayload: any = {
                id: itineraryData?.itinerary_id || itineraryData?.id,
                data: {
                    ...updatedStore,
                    website: getRefUrl()
                }
            };
            // Check for offers
            const offersResponse = await getOffers(offersPayload).unwrap();
            // If offers are present, navigate to offers page
            if (offersResponse?.offers_present) {
                setNextLoading(false);
                navigate('/offers', {
                    state: {
                        cabinData,
                        totalPrice: upgradeResponse.total,
                        actualTotalPrice: upgradeResponse.actual_total,
                        departure,
                        arrival,
                        offers: { rooms: upgradeResponse.rooms },
                        checkOffer: offersResponse,
                        actualTotalCabinFare: upgradeResponse.actual_total,
                        totalCabinFare: upgradeResponse.total
                    }
                });
            } else {
                // No offers, create booking directly
                const bookingPayload = {
                    id: itineraryData?.itinerary_id || itineraryData?.id,
                    data: {
                        auto_assign_rooms: false,
                        device: CheckDevice(),
                        rooms: upgradeResponse.rooms,
                        short_booking: true,
                        website: getRefUrl(),
                    },
                    promo_code: null
                };
                const bookingResponse = await createBooking(bookingPayload).unwrap();
                setNextLoading(false);
                navigate('/payment-summary?booking_id=' + bookingResponse.id);
            }
        } catch (error) {
            console.log('Error: ', error);
            setNextLoading(false);
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
                console.log('Errorsada: ', res);
            });
    };

    const ItineraryName = () => {
        if (itineraryData?.nights > 5) {
            return (
                <p className="text-base font-bold">
                    {itineraryData?.ports[0]?.name} -&nbsp;
                    {itineraryData?.ports[itineraryData?.ports.length - 1]?.name}
                </p>
            )
        } else {
            return (
                itineraryData?.ports?.filter((p: any) => p.name !== "At Sea")?.map((val: any, i: number) => (
                    <p key={i} className="text-base font-bold">
                        {val.name}
                        {i !== itineraryData?.ports?.filter((p: any) => p.name !== "At Sea")?.length - 1 && <span> -&nbsp;</span>}
                    </p>
                ))
            )

        }
    }

    const itineraryName =
        itineraryData?.nights > 5
            ? `${itineraryData?.ports[0]?.name} - ${itineraryData?.ports[itineraryData?.ports.length - 1]?.name}`
            : itineraryData?.ports.map((p: any) => p.name).join(' - ');

    const portList = itineraryData?.ports
        .filter((val: any) => val.name !== 'At Sea')
        .map((val: any) => val.name)
        .join(' | ');

    const isLong = portList?.length > 150;

    const startDate = moment(itineraryData?.start_date, 'DD/MM/YYYY').format('MMM DD, YYYY');
    const endDate = moment(itineraryData?.end_date, 'DD/MM/YYYY').format('MMM DD, YYYY');

    // const checkAuth = (newToken?: any) => {
    //     if (token) {
    //         if (selectedRooms && selectedRooms.length) {
    //             proceedToOffers()
    //         } else {
    //             setCouponModal(false)
    //         }
    //     } else if (newToken) {
    //         createCouponCode()
    //     } else {
    //         setAuthModal(true)
    //     }
    // }

    const [pendingCabin, setPendingCabin] = useState<number | null>(null);

    const checkAuth = (newToken?: any, index?: number) => {
        if (token || newToken) {
            if (pendingCabin !== null) {
                ChooseCabin(pendingCabin);
                setPendingCabin(null);
            } else if (typeof index === 'number') {
                ChooseCabin(index);
            } else if (selectedRooms && selectedRooms.length) {
                proceedToOffers();
            } else {
                setCouponModal(false)
            }

            if (newToken) {
                createCouponCode();
            }
        } else {
            if (typeof index === 'number') {
                setPendingCabin(index);
            }
            setPageCode('select_cabin')
            setAuthModal(true)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(couponData?.cc).then(() => {
            setCouponCopied(true);
        });
        setTimeout(() => {
            setCouponCopied(false);
        }, 2000);
    };

    return (
        <>
            <Header showHeader={false} />
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
            <main className='pt-0 pb-24 lg:pb-0'>
                <div className='sticky top-0 z-30 shadow-md'>
                    <div className='bg-brand-gradient px-4 py-3'>
                        <div className='flex justify-between items-center container mx-auto lg:px-2.5'>
                            <div className='flex gap-3 items-center'>
                                <div className='hidden lg:block pr-3 border-r border-gray-300 cursor-pointer' onClick={() => navigate('/')}>
                                    <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cordelia_onlylogo.svg" alt="cordelia_icon_only" className='w-8 h-8' />
                                </div>
                                <div className='flex gap-4 items-center'>
                                    <div className='w-2.5 h-3 cursor-pointer' onClick={() => navigate('/upcoming-cruises')}>
                                        <img src="https://images.cordeliacruises.com/cordelia_v2/public/assets/left-arrow.svg" alt="back_arrow" />
                                    </div>
                                    <div className='hidden lg:block text-xs lg:text-base font-semibold text-white'>
                                        Select Your Cabins
                                    </div>
                                </div>
                            </div>
                            <UpcHeader />
                        </div>
                    </div>
                    <div className='bg-white'>
                        <div className='px-4 pt-3.5 pb-0 lg:hidden'>
                            <p className='text-xs lg:text-lg font-semibold mb-2'>
                                {itineraryName}
                                <span className="ml-1 text-xs lg:text-lg font-semibold">
                                    ({itineraryData?.nights}N/{itineraryData?.nights + 1}D)
                                </span>
                            </p>
                            <div className='flex gap-3.5 items-center pb-3.5 border-b border-gray-300'>
                                <div className='flex gap-1 items-center'>
                                    <Calendar className='w-3.5 h-3.5' />
                                    <p className='text-xxs font-semibold'>{startDate} - {endDate}</p>
                                </div>
                                <div className='flex gap-1 items-center'>
                                    <CabinBedIcon className='w-3.5 h-3.5' />
                                    <p className='text-xxs font-semibold'>{`${selectedCabinDetail.length ? `0${selectedCabinDetail.length} Cabins` : '--'}`}</p>
                                </div>
                                <div className='flex gap-1 items-center'>
                                    <GuestsIcon className='w-3.5 h-3.5' />
                                    <p className='text-xxs font-semibold'>{`${totalGuest ? totalGuest < 9 ? `0${totalGuest} Guests` : `${totalGuest} Guests` : '--'}`}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='px-4 lg:px-0 mt-8'>
                    <div>
                        <div className='relative flex justify-center items-center my-8 lg:mt-10 mb-16 mx-auto w-[85%] lg:w-3/4'>
                            <div className='border-2 border-gray-300 w-full'></div>
                            <div className='absolute -top-2 lg:-top-3 -left-5 lg:-left-10 flex flex-col justify-center items-center'>
                                <div className='rounded-full w-5 lg:w-7 h-5 lg:h-7 bg-brand-green flex justify-center items-center mb-2.5'>
                                    <div className='w-1.5 h-1.5 bg-white rounded-full'></div>
                                </div>
                                <span className='text-xxs lg:text-base font-medium'>Select Cabin</span>
                            </div>
                            <div className='absolute left-1/2 -translate-x-1/2 -top-2 lg:-top-3 flex flex-col justify-center items-center'>
                                <div className='rounded-full w-5 lg:w-7 h-5 lg:h-7 bg-gray-200 text-gray-400 text-xxs flex justify-center items-center mb-2'>
                                    <span className='text-xxs font-medium text-gray-400'>2</span>
                                </div>
                                <span className='text-xxs lg:text-base font-medium'>Payment Summary</span>
                            </div>
                            <div className='absolute -right-5 lg:-right-10 -top-2 lg:-top-3 flex flex-col justify-center items-center'>
                                <div className='rounded-full w-5 lg:w-7 h-5 lg:h-7 bg-gray-200 text-gray-400 text-xxs flex justify-center items-center mb-2'>
                                    <span className='text-xxs font-medium text-gray-400'>3</span>
                                </div>
                                <span className='text-xxs lg:text-base font-medium'>Payments</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-8 mx-0 lg:mx-16 gap-6 mt-4 lg:mt-10'>
                            <div className='col-span-2 hidden lg:block'>
                                <div className='lg:sticky lg:top-44 pr-3'>
                                    <CallbackSide callback={() => handleOpenReqCallback('sc_rac')} />
                                </div>
                            </div>

                            <div className='grid grid-cols-3 gap-6 lg:gap-0 col-span-8 lg:col-span-6'>
                                <div className="col-span-3 lg:col-span-2 mb-4 lg:p-6 lg:no-scrollbar lg:overflow-y-scroll">
                                    {!token ?
                                        <div onClick={() => {
                                            setPageCode('sc_banner')
                                            setAuthModal(true)
                                        }} className='mb-4'>
                                            <img className='rounded cursor-pointer hidden lg:block w-full' src="https://images.cordeliacruises.com/cordelia_v2/public/images/Login_Now_to_get_attractive_offers.webp" alt="" />
                                            <img className='rounded cursor-pointer lg:hidden w-full' src="https://images.cordeliacruises.com/cordelia_v2/public/images/Login_Now_to_get_attractive_offers_mob.webp" alt="" />
                                        </div>
                                        : null
                                    }
                                    {cabinData && cabinData?.map((val: any, i: any) => (
                                        <div
                                            key={val.code}
                                            ref={(el) => (cabinRefs.current[val.name] = el)} // store ref by name
                                        >
                                            <CabinCard cabin={val} index={i} maxCapacity={val?.max_capacity} />
                                        </div>
                                    ))}
                                </div>

                                <div className='hidden lg:block lg:my-6'>
                                    <div className={`fixed lg:sticky pb-4 ${cabinDetail ? '-top-[30%]' : 'top-20'}`}>
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

                                        <div className='border-gray-400 shadow-allSide rounded-lg mb-5'>
                                            <div className='flex flex-wrap py-5 mx-5 border-b border-gray-300'>
                                                {ItineraryName()}
                                                <p className='text-base font-bold ml-1'>({itineraryData?.nights}N/{itineraryData?.nights + 1}D)</p>
                                            </div>
                                            <div className='flex items-start justify-between py-5 mx-5 border-b border-gray-300'>
                                                <div className='text-center'>
                                                    <p className='text-xs lg:text-base  font-bold'>
                                                        {itineraryData?.ports[0]?.name}
                                                    </p>
                                                    <p className='text-xs lg:text-base font-semibold lg:font-normal lg:mb-1'>
                                                        {moment(itineraryData?.start_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                                    </p>
                                                    <p className='text-xs text-gray-100 font-semibold lg:font-medium'>
                                                        {departure}
                                                    </p>
                                                </div>
                                                <div className='w-[30%] text-center relative -mt-[5px] lg:mt-6'>
                                                    <p className='text-gray-200 whitespace-nowrap overflow-hidden'>-------------</p>
                                                    <img className='absolute h-7'
                                                        style={{
                                                            top: '60%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                        src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cruise-icon.svg" alt=""
                                                    />
                                                </div>
                                                <div className='text-center'>
                                                    <p className='text-xs lg:text-base font-bold'>
                                                        {itineraryData?.ports[itineraryData?.ports.length - 1]?.name}
                                                    </p>
                                                    <p className='text-xs lg:text-base font-semibold lg:font-normal lg:mb-1'>
                                                        {moment(itineraryData?.end_date, 'DD/MM/YYYY').format('MMM DD, YYYY')}
                                                    </p>
                                                    <p className='text-xs text-gray-100 font-semibold lg:font-medium'>
                                                        {arrival}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`flex flex-col items-start py-5 mx-5 ${selectedCabinDetail && totalPrice && totalGuest ? 'border-b border-gray-300' : ''}`}>
                                                <p className="text-xs lg:text-sm font-medium lg:font-bold">
                                                    Visiting Ports:
                                                </p>
                                                <div className="">
                                                    <span className="text-xs lg:text-sm font-medium lg:font-semibold !leading-5">
                                                        {isLong && !isExpanded ? portList?.slice(0, 22) + '...' : portList}
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
                                            {selectedCabinDetail && totalPrice && totalGuest ? (
                                                <>
                                                    <div className='flex py-5 mx-5 justify-between'>
                                                        <div className='w-[180px]'>
                                                            <div className='flex items-center'>
                                                                <div className='w-[40px] flex items-center justify-center'>
                                                                    <img className='mr-2 w-4' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/room-icon.svg" alt="" />
                                                                </div>
                                                                <p className='text-sm font-semibold'>0{selectedCabinDetail.length} Cabin</p>
                                                            </div>
                                                            <div className='flex items-center'>
                                                                <div className='w-[40px] flex items-center justify-center'>
                                                                    <img className='mr-2 w-6' src="https://images.cordeliacruises.com/cordelia_v2/public/assets/max-capacity-icon.svg" alt="" />
                                                                </div>
                                                                <p className='text-sm font-semibold'>{`${totalGuest < 9 ? '0' : ''}${totalGuest} Guests`}</p>
                                                            </div>
                                                        </div>
                                                        <div className='text-right'>
                                                            <div className='flex items-center justify-end'>
                                                                {itineraryData?.discount_pct != 0 ? <p className='text-xs text-gray-100 font-semibold line-through mr-2'>₹{FormatAmount(actualTotalPrice)}</p> : null}
                                                                <p className='text-base font-bold'>₹{FormatAmount(totalPrice)}</p>
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
                                                    <p onClick={() => setOpen(true)} className="text-[8px] lg:text-xs mt-1.5 lg:mt-2 font-semibold text-gray-1100 bg-gray-400 py-2 inline-flex gap-1 items-baseline w-full justify-center cursor-pointer">
                                                        No-Cost EMI starts at{" "}
                                                        <span className="inline items-center gap-1 text-brand-primary text-xl font-bold whitespace-nowrap">
                                                            ₹{emiAmount}{" "}
                                                            <span className="text-xs text-gray-1100 font-normal">/month</span>
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
                                                                    className='w-[10px] h-[10px] lg:w-3 lg:h-3'
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
                                                    {cabinDetail ? (
                                                        <>
                                                            <div className='px-5'>
                                                                {selectedCabinDetail?.map((val: any, i: number) => (
                                                                    <div className={`flex items-center justify-between py-3`}>
                                                                        <div className=''>
                                                                            <div className='mb-2 text-xs font-bold text-gray-100'>
                                                                                <span className='text-black'>Cabin {i + 1}: </span> {val?.cabinName}
                                                                            </div>
                                                                            <li className='text-xs font-medium text-gray-100 ml-3'>
                                                                                {val?.totalGuest} Guests:  {val?.adult} Adult | {val?.children} Children | {val?.infant} Infant
                                                                            </li>
                                                                        </div>
                                                                        <div className='flex gap-2'>
                                                                            <div className='w-5 h-5 flex justify-center items-center cursor-pointer' onClick={() => handleEditCabin(val?.cabinName)}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                                                    <path d="M11.8161 0.540038C11.5485 0.27258 11.1857 0.12233 10.8074 0.12233C10.4291 0.12233 10.0663 0.27258 9.79875 0.540038L8.62531 1.71419L12.4081 5.49699L13.5816 4.32427C13.7141 4.19179 13.8192 4.03449 13.891 3.86136C13.9627 3.68823 13.9996 3.50266 13.9996 3.31526C13.9996 3.12786 13.9627 2.9423 13.891 2.76917C13.8192 2.59604 13.7141 2.43874 13.5816 2.30625L11.8161 0.540038ZM11.3995 6.50565L7.61666 2.72284L1.31436 9.02514L0.546814 13.5762L5.09788 12.8079L11.3995 6.50565Z" fill="#494949" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className='w-5 h-5 flex justify-center items-center cursor-pointer' onClick={() => handleRemoveCabin(i)}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="16" viewBox="0 0 13 16" fill="none">
                                                                                    <mask id="mask0_364_5171" maskUnits="userSpaceOnUse" x="0" y="0" width="13" height="16">
                                                                                        <path d="M12.041 0.864731H0.448242V15.1353H12.041V0.864731Z" fill="white" />
                                                                                    </mask>
                                                                                    <g mask="url(#mask0_364_5171)">
                                                                                        <path d="M11.0338 5.99492H1.45121C1.15667 5.99492 1.14931 5.99492 1.16256 6.29719C1.21018 7.38037 1.26062 8.46343 1.31388 9.54636C1.38126 10.9406 1.46115 12.3349 1.51675 13.7296C1.50895 13.9175 1.54048 14.1049 1.60932 14.2799C1.67816 14.4549 1.78279 14.6135 1.91651 14.7457C2.05024 14.8779 2.2101 14.9807 2.38586 15.0476C2.56162 15.1144 2.7494 15.1438 2.93718 15.1338C5.1433 15.1355 7.34954 15.1355 9.5559 15.1338C9.74185 15.1436 9.92779 15.1147 10.102 15.0489C10.2762 14.9831 10.4348 14.8819 10.5679 14.7516C10.7009 14.6214 10.8055 14.4649 10.875 14.2922C10.9445 14.1194 10.9774 13.9341 10.9715 13.748C11.012 12.6571 11.0698 11.5669 11.1225 10.4767C11.1899 9.08209 11.2609 7.68817 11.3265 6.29351C11.3405 5.99603 11.3327 5.99529 11.0319 5.99529M4.46254 12.7631C4.46254 13.1412 4.2987 13.3522 4.01115 13.3493C3.7306 13.3456 3.56934 13.1379 3.56934 12.7742C3.56934 10.9333 3.56934 9.09166 3.56934 7.2493C3.56934 6.86971 3.73134 6.66022 4.02035 6.66353C4.30937 6.66684 4.46217 6.87523 4.46217 7.26035C4.46217 8.17367 4.46217 9.08712 4.46217 10.0007C4.46217 10.9214 4.46217 11.8418 4.46217 12.762M6.69111 12.7893C6.69111 12.8261 6.69111 12.8629 6.69111 12.8997C6.69097 12.9591 6.67903 13.0179 6.65597 13.0727C6.63291 13.1275 6.59919 13.1771 6.55678 13.2187C6.51437 13.2603 6.46411 13.2931 6.40893 13.3152C6.35374 13.3372 6.29472 13.348 6.23531 13.3471C6.11884 13.3447 6.008 13.2965 5.92691 13.2129C5.84582 13.1292 5.80105 13.0169 5.80233 12.9005C5.7946 12.5367 5.80012 12.1729 5.80012 11.8088C5.80012 11.2072 5.80012 10.6058 5.80012 10.0047C5.80012 9.06908 5.80012 8.13342 5.80012 7.19775C5.79277 7.12771 5.79965 7.05691 5.82034 6.9896C5.84103 6.92228 5.8751 6.85984 5.92052 6.80601C5.97449 6.74387 6.04542 6.69882 6.12462 6.67639C6.20382 6.65396 6.28783 6.65512 6.36638 6.67973C6.44945 6.70179 6.52414 6.74792 6.58107 6.81232C6.638 6.87671 6.67462 6.9565 6.68633 7.04165C6.69397 7.1006 6.69606 7.16014 6.69259 7.21948C6.69259 9.07607 6.69259 10.9325 6.69259 12.7889M8.92116 12.8128C8.92116 13.1387 8.75364 13.3412 8.48561 13.3474C8.20985 13.3541 8.03054 13.1442 8.03018 12.8099C8.03018 11.8742 8.03018 10.9386 8.03018 10.0029C8.03018 9.05987 8.03018 8.11685 8.03018 7.17382C8.03018 6.84983 8.2312 6.63997 8.50881 6.66279C8.57009 6.6685 8.62959 6.68653 8.68375 6.71579C8.7379 6.74504 8.78559 6.78493 8.82396 6.83306C8.86233 6.88119 8.89058 6.93657 8.90703 6.99589C8.92348 7.0552 8.92779 7.11723 8.91969 7.17824C8.92116 8.21798 8.92116 9.25759 8.91969 10.2971C8.91969 11.1363 8.91969 11.9753 8.91969 12.8143" fill="#494949" />
                                                                                        <path d="M12.0399 3.82083C12.048 3.66441 12.0229 3.50805 11.9665 3.36196C11.91 3.21588 11.8233 3.08335 11.7121 2.97304C11.6009 2.86272 11.4677 2.77709 11.3212 2.72175C11.1747 2.66641 11.0181 2.6426 10.8618 2.65186C10.216 2.64929 9.56985 2.65186 8.92406 2.65186C8.48225 2.65186 8.48225 2.65186 8.47231 2.21005C8.47348 2.03373 8.43962 1.85893 8.37269 1.69581C8.30575 1.53268 8.20708 1.38447 8.0824 1.25979C7.95772 1.13511 7.80952 1.03644 7.64639 0.969508C7.48326 0.902574 7.30846 0.868711 7.13214 0.869885C6.5384 0.863013 5.9444 0.863013 5.35017 0.869885C5.07015 0.8688 4.79698 0.956427 4.56984 1.1202C4.3427 1.28397 4.17327 1.51547 4.08585 1.78149C4.01667 2.00146 3.9941 2.23344 4.01957 2.46262C4.03099 2.62204 3.97944 2.65702 3.82518 2.65518C3.08293 2.64634 2.34032 2.64781 1.5977 2.65223C1.44495 2.64669 1.2927 2.67275 1.15049 2.72879C1.00828 2.78483 0.879172 2.86963 0.771261 2.97789C0.663351 3.08614 0.578961 3.21552 0.523379 3.35791C0.467797 3.5003 0.44222 3.65263 0.448252 3.80536C0.448252 4.04284 0.448252 4.28031 0.448252 4.51816C0.448252 4.95997 0.590369 5.10319 1.03513 5.10319H6.24778C8.00006 5.10319 9.75234 5.10319 11.5046 5.10319C11.8728 5.10319 12.0374 4.94156 12.0399 4.57854C12.0417 4.32597 12.0417 4.07315 12.0399 3.82083ZM7.18001 2.6515H6.24484C5.85126 2.6515 5.45804 2.64671 5.06446 2.65444C4.94038 2.65702 4.89068 2.62499 4.90504 2.49649C4.91535 2.40114 4.90504 2.30357 4.90835 2.20711C4.90733 2.14935 4.91778 2.09196 4.93911 2.03828C4.96044 1.9846 4.99222 1.93568 5.0326 1.89438C5.07298 1.85307 5.12116 1.82019 5.17435 1.79766C5.22754 1.77512 5.28467 1.76337 5.34243 1.76308C5.94355 1.75498 6.5449 1.75498 7.1465 1.76308C7.20598 1.76354 7.26474 1.77607 7.31923 1.79991C7.37372 1.82375 7.4228 1.85842 7.46349 1.90179C7.50418 1.94517 7.53564 1.99636 7.55596 2.05226C7.57628 2.10816 7.58503 2.1676 7.58169 2.22699C7.59899 2.64965 7.59899 2.64965 7.18001 2.64965" fill="#494949" />
                                                                                    </g>
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : null}
                                                    <div onClick={() => setCabinDetail(!cabinDetail)} className='px-5 py-3 flex cursor-pointer items-center justify-center bg-[#F6F9FF] rounded-b-lg'>
                                                        <p className='text-sm text-brand-blue-2 font-semibold text-center cursor-pointer'>{cabinDetail ? 'Hide Cabin Details' : 'View Cabin Details'}</p>
                                                        <img className={`h-2 ml-2 ${cabinDetail ? 'rotate-180' : ''}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-upcoming-icon.svg" alt="" />
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>

                                        {selectedCabinDetail && totalPrice && totalGuest ? (
                                            <Button
                                                text='Proceed'
                                                disabled={checkCabinSelect(cabinData)}
                                                // handleClick={() => checkAuth()}
                                                handleClick={() => proceedToOffers()}
                                                isLoading={nextLoading}
                                                className='w-full !rounded-full'
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {selectedCabinDetail && totalPrice && totalGuest ? (
                <div className='fixed w-full bottom-0 bg-white z-[29] lg:hidden shadow-[rgba(0,0,0,0.14)_5px_-2px_5px]'>
                    <div className='bg-brand-blue/10 px-4 py-2 flex justify-between items-center' onClick={() => setCabinDetail(!cabinDetail)}>
                        <p className='text-xs text-brand-blue-2 font-bold'>{selectedCabinDetail.length} Cabin - {totalGuest} Guests</p>
                        <div className='bg-white rounded-full w-5 h-5 flex justify-center items-center'>
                            <img className={`w-2.5 h-2.5 ${cabinDetail ? '' : 'rotate-[270deg]'}`} src="https://images.cordeliacruises.com/cordelia_v2/public/assets/dropdown-upcoming-icon.svg" alt="" />
                        </div>
                    </div>
                    {cabinDetail ? (
                        <>
                            <div className='px-5'>
                                {selectedCabinDetail?.map((val: any, i: number) => (
                                    <div className={`flex items-center justify-between py-3 ${selectedCabinDetail.length > 0 ? '[&:not(:last-child)]:border-b border-gray-300' : ''}`}>
                                        <div className=''>
                                            <div className='mb-2 text-xs font-bold text-gray-100'>
                                                <span className='text-black'>Cabin {i + 1}: </span> {val?.cabinName}
                                            </div>
                                            <li className='text-xs font-medium text-gray-100 ml-3'>
                                                {val?.totalGuest} Guests:  {val?.adult} Adult | {val?.children} Children | {val?.infant} Infant
                                            </li>
                                        </div>
                                        <div className='flex gap-2'>
                                            <div className='w-5 h-5 flex justify-center items-center' onClick={() => handleEditCabin(val?.cabinName)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M11.8161 0.540038C11.5485 0.27258 11.1857 0.12233 10.8074 0.12233C10.4291 0.12233 10.0663 0.27258 9.79875 0.540038L8.62531 1.71419L12.4081 5.49699L13.5816 4.32427C13.7141 4.19179 13.8192 4.03449 13.891 3.86136C13.9627 3.68823 13.9996 3.50266 13.9996 3.31526C13.9996 3.12786 13.9627 2.9423 13.891 2.76917C13.8192 2.59604 13.7141 2.43874 13.5816 2.30625L11.8161 0.540038ZM11.3995 6.50565L7.61666 2.72284L1.31436 9.02514L0.546814 13.5762L5.09788 12.8079L11.3995 6.50565Z" fill="#494949" />
                                                </svg>
                                            </div>
                                            <div className='w-5 h-5 flex justify-center items-center' onClick={() => handleRemoveCabin(i)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="16" viewBox="0 0 13 16" fill="none">
                                                    <mask id="mask0_364_5171" maskUnits="userSpaceOnUse" x="0" y="0" width="13" height="16">
                                                        <path d="M12.041 0.864731H0.448242V15.1353H12.041V0.864731Z" fill="white" />
                                                    </mask>
                                                    <g mask="url(#mask0_364_5171)">
                                                        <path d="M11.0338 5.99492H1.45121C1.15667 5.99492 1.14931 5.99492 1.16256 6.29719C1.21018 7.38037 1.26062 8.46343 1.31388 9.54636C1.38126 10.9406 1.46115 12.3349 1.51675 13.7296C1.50895 13.9175 1.54048 14.1049 1.60932 14.2799C1.67816 14.4549 1.78279 14.6135 1.91651 14.7457C2.05024 14.8779 2.2101 14.9807 2.38586 15.0476C2.56162 15.1144 2.7494 15.1438 2.93718 15.1338C5.1433 15.1355 7.34954 15.1355 9.5559 15.1338C9.74185 15.1436 9.92779 15.1147 10.102 15.0489C10.2762 14.9831 10.4348 14.8819 10.5679 14.7516C10.7009 14.6214 10.8055 14.4649 10.875 14.2922C10.9445 14.1194 10.9774 13.9341 10.9715 13.748C11.012 12.6571 11.0698 11.5669 11.1225 10.4767C11.1899 9.08209 11.2609 7.68817 11.3265 6.29351C11.3405 5.99603 11.3327 5.99529 11.0319 5.99529M4.46254 12.7631C4.46254 13.1412 4.2987 13.3522 4.01115 13.3493C3.7306 13.3456 3.56934 13.1379 3.56934 12.7742C3.56934 10.9333 3.56934 9.09166 3.56934 7.2493C3.56934 6.86971 3.73134 6.66022 4.02035 6.66353C4.30937 6.66684 4.46217 6.87523 4.46217 7.26035C4.46217 8.17367 4.46217 9.08712 4.46217 10.0007C4.46217 10.9214 4.46217 11.8418 4.46217 12.762M6.69111 12.7893C6.69111 12.8261 6.69111 12.8629 6.69111 12.8997C6.69097 12.9591 6.67903 13.0179 6.65597 13.0727C6.63291 13.1275 6.59919 13.1771 6.55678 13.2187C6.51437 13.2603 6.46411 13.2931 6.40893 13.3152C6.35374 13.3372 6.29472 13.348 6.23531 13.3471C6.11884 13.3447 6.008 13.2965 5.92691 13.2129C5.84582 13.1292 5.80105 13.0169 5.80233 12.9005C5.7946 12.5367 5.80012 12.1729 5.80012 11.8088C5.80012 11.2072 5.80012 10.6058 5.80012 10.0047C5.80012 9.06908 5.80012 8.13342 5.80012 7.19775C5.79277 7.12771 5.79965 7.05691 5.82034 6.9896C5.84103 6.92228 5.8751 6.85984 5.92052 6.80601C5.97449 6.74387 6.04542 6.69882 6.12462 6.67639C6.20382 6.65396 6.28783 6.65512 6.36638 6.67973C6.44945 6.70179 6.52414 6.74792 6.58107 6.81232C6.638 6.87671 6.67462 6.9565 6.68633 7.04165C6.69397 7.1006 6.69606 7.16014 6.69259 7.21948C6.69259 9.07607 6.69259 10.9325 6.69259 12.7889M8.92116 12.8128C8.92116 13.1387 8.75364 13.3412 8.48561 13.3474C8.20985 13.3541 8.03054 13.1442 8.03018 12.8099C8.03018 11.8742 8.03018 10.9386 8.03018 10.0029C8.03018 9.05987 8.03018 8.11685 8.03018 7.17382C8.03018 6.84983 8.2312 6.63997 8.50881 6.66279C8.57009 6.6685 8.62959 6.68653 8.68375 6.71579C8.7379 6.74504 8.78559 6.78493 8.82396 6.83306C8.86233 6.88119 8.89058 6.93657 8.90703 6.99589C8.92348 7.0552 8.92779 7.11723 8.91969 7.17824C8.92116 8.21798 8.92116 9.25759 8.91969 10.2971C8.91969 11.1363 8.91969 11.9753 8.91969 12.8143" fill="#494949" />
                                                        <path d="M12.0399 3.82083C12.048 3.66441 12.0229 3.50805 11.9665 3.36196C11.91 3.21588 11.8233 3.08335 11.7121 2.97304C11.6009 2.86272 11.4677 2.77709 11.3212 2.72175C11.1747 2.66641 11.0181 2.6426 10.8618 2.65186C10.216 2.64929 9.56985 2.65186 8.92406 2.65186C8.48225 2.65186 8.48225 2.65186 8.47231 2.21005C8.47348 2.03373 8.43962 1.85893 8.37269 1.69581C8.30575 1.53268 8.20708 1.38447 8.0824 1.25979C7.95772 1.13511 7.80952 1.03644 7.64639 0.969508C7.48326 0.902574 7.30846 0.868711 7.13214 0.869885C6.5384 0.863013 5.9444 0.863013 5.35017 0.869885C5.07015 0.8688 4.79698 0.956427 4.56984 1.1202C4.3427 1.28397 4.17327 1.51547 4.08585 1.78149C4.01667 2.00146 3.9941 2.23344 4.01957 2.46262C4.03099 2.62204 3.97944 2.65702 3.82518 2.65518C3.08293 2.64634 2.34032 2.64781 1.5977 2.65223C1.44495 2.64669 1.2927 2.67275 1.15049 2.72879C1.00828 2.78483 0.879172 2.86963 0.771261 2.97789C0.663351 3.08614 0.578961 3.21552 0.523379 3.35791C0.467797 3.5003 0.44222 3.65263 0.448252 3.80536C0.448252 4.04284 0.448252 4.28031 0.448252 4.51816C0.448252 4.95997 0.590369 5.10319 1.03513 5.10319H6.24778C8.00006 5.10319 9.75234 5.10319 11.5046 5.10319C11.8728 5.10319 12.0374 4.94156 12.0399 4.57854C12.0417 4.32597 12.0417 4.07315 12.0399 3.82083ZM7.18001 2.6515H6.24484C5.85126 2.6515 5.45804 2.64671 5.06446 2.65444C4.94038 2.65702 4.89068 2.62499 4.90504 2.49649C4.91535 2.40114 4.90504 2.30357 4.90835 2.20711C4.90733 2.14935 4.91778 2.09196 4.93911 2.03828C4.96044 1.9846 4.99222 1.93568 5.0326 1.89438C5.07298 1.85307 5.12116 1.82019 5.17435 1.79766C5.22754 1.77512 5.28467 1.76337 5.34243 1.76308C5.94355 1.75498 6.5449 1.75498 7.1465 1.76308C7.20598 1.76354 7.26474 1.77607 7.31923 1.79991C7.37372 1.82375 7.4228 1.85842 7.46349 1.90179C7.50418 1.94517 7.53564 1.99636 7.55596 2.05226C7.57628 2.10816 7.58503 2.1676 7.58169 2.22699C7.59899 2.64965 7.59899 2.64965 7.18001 2.64965" fill="#494949" />
                                                    </g>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='border-t border-gray-300 w-full' />
                        </>
                    ) : null}
                    <div className='bg-white px-4 py-1 '>
                        <div className='flex justify-between items-center mb-4'>
                            <div>
                                <div className='flex items-center'>
                                    <p className='text-sm font-bold'>₹{FormatAmount(totalPrice)}</p>
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
                                <p onClick={() => setOpen(true)} className="text-[8px] lg:text-xs mt-1.5 lg:mt-2 font-semibold text-gray-1100 bg-gray-400 rounded-md px-1.5 inline-flex gap-1 items-baseline">
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
                                </p>
                            </div>
                            <div className=''>
                                <Button text='Proceed' size='sm' disabled={checkCabinSelect(cabinData)} handleClick={() => checkAuth()} isLoading={nextLoading} className='w-full !rounded-full px-10' />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <BottomSheet
                isOpen={innerWidth < 600 && amenitiesModal}
                setIsOpen={() => {
                    setAmenitiesModal(false);
                    setActiveAmenities('');
                }}
                onClose={() => {
                    setAmenitiesModal(false);
                    setActiveAmenities('');
                }}
                title={amenitiesData?.name}
                hasBtns={false}
            >
                <div>
                    {amenitiesData && amenitiesData?.name &&
                        <div className='overflow-scroll no-scrollbar h-full text-center bg-white flex rounded'>
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
                                <div className='text-left py-4'>
                                    <p className='font-inter text-xs lg:text-[0.94rem] lg:leading-6 text-gray-600'>{amenitiesData?.subtitle}</p>
                                    <div className='w-full mt-4 lg:hidden'>
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
                                    <div className='flex flex-wrap gap-1.5 pt-4'>
                                        {amenitiesData?.itinerary?.map((item: any) => <div className='bg-gray-400 text-gray-100 flex gap-1.5 rounded-full items-center px-2 py-1'>
                                            <span>
                                                <img src={item.icon} alt={item.title} />
                                            </span>
                                            <p className='text-xxs lg:text-sm'>{item.title}</p>
                                        </div>)}
                                    </div>
                                    {amenitiesData.note &&
                                        <div>
                                            <p className='font-inter mt-2 lg:mt-3 text-xs lg:text-base lg:leading-7 text-gray-600'><span className='text-brand-primary font-semibold'>Note: </span>{amenitiesData.note}</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </BottomSheet>

            <Modal show={innerWidth > 600 && amenitiesModal} align={'center'} mainClassName="!items-end lg:items-center" className="w-full lg:w-3/4 center overflow-hidden left-0 right-0 lg:m-auto top-0 bottom-0 h-auto max-h-[540px] relative" onClose={() => {
                setAmenitiesModal(false)
                setActiveAmenities('')
            }}>
                <div className='flex items-center justify-center pt-4 pr-4 absolute right-0 top-0'>
                    <p className='text-base lg:text-xl font-bold cursor-pointer' onClick={() => {
                        setAmenitiesModal(false)
                        setActiveAmenities('')
                    }}>
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
                    </p>
                </div>
                {amenitiesData && amenitiesData?.name &&
                    <div className='overflow-scroll no-scrollbar h-full  px-2 lg:px-6 py-2 lg:py-6 text-center bg-white flex rounded-xl'>
                        <div className='w-[50%] hidden lg:block'>
                            <ImageGallery
                                items={amenitiesData?.imageArr}
                                showFullscreenButton={false}
                                showPlayButton={false}
                                autoPlay={true}
                                slideInterval={5000}
                                showThumbnails={false}
                                thumbnailPosition={'bottom'}
                                startIndex={0}
                                lazyLoad={true}
                            />
                        </div>
                        <div className='w-full lg:w-[50%] '>
                            <div className='text-left pt-0 pl-2 lg:pl-6 py-2 lg:pb-6 overflow-y-auto h-[360px] no-scrollbar'>
                                <p className='text-lg lg:text-2xl font-semibold font-inter'>{amenitiesData?.name}</p>
                                <p className='font-inter mt-2 lg:mt-2 text-xs lg:text-[0.94rem] lg:leading-6 text-gray-600'>{amenitiesData?.subtitle}</p>
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
                                <p className='text-base lg:text-xl font-semibold font-inter mt-3 lg:mt-4'>Amenities</p>
                                <div className='flex flex-wrap gap-3 pt-4'>
                                    {amenitiesData?.itinerary?.map((item: any) => <div className='bg-gray-400 text-gray-100 flex gap-1.5 rounded-full items-center px-2 py-1'>
                                        <span>
                                            <img src={item.icon} alt={item.title} />
                                        </span>
                                        <p className='text-xxs lg:text-sm'>{item.title}</p>
                                    </div>)}
                                </div>
                                {amenitiesData.note &&
                                    <div>
                                        <p className='font-inter mt-2 lg:mt-3 text-xs lg:text-base lg:leading-7 text-gray-600'><span className='text-brand-primary font-semibold'>Note: </span>{amenitiesData.note}</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </Modal>

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
            <ProfileAuthV2
                authModal={authModal}
                pageCode={pageCode}
                setAuthModal={() => setAuthModal(false)}
                callback={(token: any) => checkAuth(token)}
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
                            disabled={isLoading || isLoading1}
                            handleClick={() => checkAuth()}
                            text='Complete Your Booking'
                            size='sm'
                            className='rounded-full !px-14'
                            isLoading={nextLoading}
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
                <EMICard emiTotalAmount={Math.round(totalPrice)} />
            </BottomSheet> : 
            <Modal
                show={open}
                align={'center'}
                className="drop-shadow bg-white w-full lg:w-1/2 center  lg:top-1/5 bottom-0 lg:bottom-1/6 lg:left-1/3 left-4 lg:h-auto lg:max-h-[80%] overflow-auto rounded-none lg:rounded-lg border"
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
                <EMICard emiTotalAmount={Math.round(totalPrice)} />
            </Modal>}

            <div className={`fixed ${selectedCabinDetail.length && window.innerWidth < 765 ? 'bottom-24' : 'bottom-0'}  right-4 z-[99] border`}>
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
                    initOpen={selectedCabinDetail.length || window.innerWidth < 765 ? true : false}
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

            <RequestCallbackModal initOpen={showRequestACallback} onClose={() => setShowRequestACallback(false)} pageCode={pageCode} />

            <CruiseChatbot
                availablePorts={[]}
                availableOrigins={[]}
                availableDates={[]}
                availableNights={[]}
                itineraryCount={1}
                isLoading={false}
                itineraries={[]}
                onApplyFilters={() => {}}
                onResetFilters={() => {}}
                isLoggedIn={token ? true : false}
                availableCabins={chatbotAvailableCabins}
                onSelectCabin={handleChatbotCabinSelect}
            />
        </>
    );
}