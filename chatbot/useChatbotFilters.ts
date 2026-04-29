import { useCallback } from 'react';
import { ExtractedFilters as ParsedFilters } from './aiService';

interface FilterSetters {
    setTempDestinationFilter: (val: any) => void;
    setTempMonthFilter: (val: any) => void;
    setTempNoOfNightFilter: (val: any) => void;
    setTempOriginFilter: (val: any) => void;
    setTempTripTypeFilter: (val: any) => void;
    setTempCruiseFilter: (val: any) => void;
    setDestinationFilter: (val: any) => void;
    setMonthFilter: (val: any) => void;
    setNoOfNightFilter: (val: any) => void;
    setOriginFilter: (val: any) => void;
    setTripTypeFilter: (val: any) => void;
    setCruiseFilter: (val: any) => void;
    setFilterApplied: (val: any) => void;
    setPage: (val: any) => void;
    setParams: (val: any) => void;
    setActiveFilter: (val: any) => void;
    fetchData: (payload: string, isManualSearch?: boolean) => void;
    sortOrder: string | null;
}

export function useChatbotFilters(setters: FilterSetters) {
    const applyFromChatbot = useCallback((filters: ParsedFilters) => {
        const {
            setTempDestinationFilter, setTempMonthFilter, setTempNoOfNightFilter,
            setTempOriginFilter, setTempTripTypeFilter, setTempCruiseFilter,
            setDestinationFilter, setMonthFilter, setNoOfNightFilter,
            setOriginFilter, setTripTypeFilter, setCruiseFilter,
            setFilterApplied, setPage, setParams, setActiveFilter,
            fetchData, sortOrder,
        } = setters;

        setActiveFilter('');
        setPage(1);
        setFilterApplied(true);

        let _payload = '?pagination=true&page=1';
        let newParams = '';

        // Destinations
        if (filters.destinations.length > 0) {
            setTempDestinationFilter(filters.destinations);
            setDestinationFilter(filters.destinations);
            _payload += `&ports=${JSON.stringify(filters.destinations)}`;
            newParams += `&ports=${JSON.stringify(filters.destinations)}`;
        } else {
            setTempDestinationFilter([]);
            setDestinationFilter([]);
        }

        // Months
        if (filters.months.length > 0) {
            setTempMonthFilter(filters.months);
            setMonthFilter(filters.months);
            _payload += `&dates=${JSON.stringify(filters.months)}`;
            newParams += `&dates=${JSON.stringify(filters.months)}`;
        } else {
            setTempMonthFilter([]);
            setMonthFilter([]);
        }

        // Nights
        if (filters.nights.length > 0) {
            setTempNoOfNightFilter(filters.nights);
            setNoOfNightFilter(filters.nights);
            _payload += `&night_counts=${JSON.stringify(filters.nights.map(Number))}`;
            newParams += `&night_counts=${JSON.stringify(filters.nights.map(Number))}`;
        } else {
            setTempNoOfNightFilter([]);
            setNoOfNightFilter([]);
        }

        // Origins
        if (filters.origins.length > 0) {
            setTempOriginFilter(filters.origins);
            setOriginFilter(filters.origins);
            _payload += `&starting_ports=${JSON.stringify(filters.origins)}`;
            newParams += `&starting_ports=${JSON.stringify(filters.origins)}`;
        } else {
            setTempOriginFilter([]);
            setOriginFilter([]);
        }

        // Trip Type
        if (filters.tripType.length > 0) {
            setTempTripTypeFilter(filters.tripType);
            setTripTypeFilter(filters.tripType);
            _payload += `&trip_type=${JSON.stringify(filters.tripType)}`;
            newParams += `&trip_type=${JSON.stringify(filters.tripType)}`;
        } else {
            setTempTripTypeFilter([]);
            setTripTypeFilter([]);
        }

        // Cruise filter stays unchanged (chatbot doesn't set ship IDs)
        setTempCruiseFilter([]);
        setCruiseFilter([]);

        if (sortOrder) {
            _payload += `&sort_type=${sortOrder}`;
        }

        setParams(newParams);
        fetchData(_payload, true);
    }, [setters]);

    const resetFromChatbot = useCallback(() => {
        const {
            setTempDestinationFilter, setTempMonthFilter, setTempNoOfNightFilter,
            setTempOriginFilter, setTempTripTypeFilter, setTempCruiseFilter,
            setDestinationFilter, setMonthFilter, setNoOfNightFilter,
            setOriginFilter, setTripTypeFilter, setCruiseFilter,
            setParams, setPage, fetchData, setFilterApplied, setActiveFilter,
        } = setters;

        setActiveFilter('');
        setTempDestinationFilter([]);
        setTempMonthFilter([]);
        setTempNoOfNightFilter([]);
        setTempCruiseFilter([]);
        setTempOriginFilter([]);
        setTempTripTypeFilter([]);
        setDestinationFilter([]);
        setMonthFilter([]);
        setNoOfNightFilter([]);
        setCruiseFilter([]);
        setOriginFilter([]);
        setTripTypeFilter([]);
        setFilterApplied(false);
        setPage(1);
        setParams('');
        fetchData('?pagination=true&page=1');
    }, [setters]);

    return { applyFromChatbot, resetFromChatbot };
}
