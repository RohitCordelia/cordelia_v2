import React, { useEffect, useState } from 'react';
import { Calendar, DateObject } from 'react-multi-date-picker';
import moment from 'moment';

export default function DatePickerModal({
    datesToHighlight,
    setDateFilter = () => { },
    selectedStartDate,
    selectedEndDate
}: any) {
    const [values, setValues] = useState([moment(selectedStartDate, 'DD/MM/YYYY').format('YYYY/MM/DD'), moment(selectedEndDate, 'DD/MM/YYYY').format('YYYY/MM/DD')])
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"]
    
    const handleDateChange = (newValues: any) => {
        setValues(newValues);
        setDateFilter(newValues)
    };

    const mapDays = ({ date }) => {
        const today = new DateObject().format("DD/MM/YYYY");
        let formattedDate = date.format("DD/MM/YYYY");
        if (formattedDate === today) {
            return {
                style: { backgroundColor: "#fff", color: "#000" }
            };
        }
        if (datesToHighlight?.includes(formattedDate)) {
            return {
                className: "highlight",
                style: { backgroundColor: "rgba(234, 114, 91, 0.1)", height: "33px", width: "33px", margin: "-5px", fontWeight: "600", color: "#000" }
            };
        }
        return {
            style: { fontWeight: "600" },
            className: "range-hover"
        }
    };

    return (
        <>
            <div className='calendar-wrapper w-50' >
                <div className='calendar-box w-full flex justify-center'>
                    <Calendar
                        // key={`${selectedYear}-${selectedMonth}`}
                        value={values}
                        onChange={handleDateChange}
                        range
                        className='w-full '
                        rangeHover
                        weekDays={weekDays}
                        weekStartDayIndex={1}
                        mapDays={mapDays}
                        minDate={new Date()}
                    />
                </div>
            </div>

        </>
    );
}
