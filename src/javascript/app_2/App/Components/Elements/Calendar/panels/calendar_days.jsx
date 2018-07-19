import classNames         from 'classnames';
import moment             from 'moment';
import React              from 'react';
import CalendarPanelTypes from './types';
import { localize }       from '../../../../../../_common/localize';
import { padLeft }        from '../../../../../../_common/string_util';

const getDays = ({ calendar_date, date_format, max_date, min_date, onClick, selected_date }) => {
    const dates = [];
    const days  = [];
    const moment_today       = moment().utc();
    const moment_cur_date    = moment.utc(calendar_date);
    const num_of_days        = moment_cur_date.daysInMonth() + 1;
    const moment_month_start = moment_cur_date.clone().startOf('month');
    const moment_month_end   = moment_cur_date.clone().endOf('month');
    const first_day          = moment_month_start.day();
    const last_day           = moment_month_end.day();
    const moment_min_date    = moment.utc(min_date);
    const moment_max_date    = moment.utc(max_date);
    const moment_selected    = moment.utc(selected_date);

    for (let i = first_day; i > 0; i--) {
        dates.push(moment_month_start.clone().subtract(i, 'day').format(date_format));
    }
    for (let idx = 1; idx < num_of_days; idx += 1) {
        dates.push(moment_cur_date.clone().format(date_format.replace('DD', padLeft(idx, 2, '0'))));
    }
    for (let i = 1; i <= 6 - last_day; i++) {
        dates.push(moment_month_end.clone().add(i, 'day').format(date_format));
    }

    dates.map((date) => {
        const moment_date    = moment.utc(date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        const is_disabled    = moment_date.isBefore(moment_min_date) || moment_date.isAfter(moment_max_date);
        const is_other_month = moment_date.isBefore(moment_month_start) || moment_date.isAfter(moment_month_end);
        const is_active      = selected_date && moment_date.isSame(moment_selected);
        const is_today       = moment_date.isSame(moment_today, 'day');

        days.push(
            <span
                key={date}
                className={classNames('calendar-date', {
                    active  : is_active && !is_disabled,
                    today   : is_today,
                    disabled: is_disabled,
                    hidden  : is_other_month,
                })}
                onClick={(e) => { onClick.date(e, is_disabled); }}
                data-date={date}
            >
                {moment_date.date()}
            </span>
        );
    });

    return days;
};

const week_headers = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarDays(props) {
    const days = getDays(props).map(day => day);

    return (
        <div className='calendar-date-panel'>
            {week_headers.map((item, idx) => (<span key={idx} className='calendar-date-header'>{localize(item)}</span>))}
            {days}
        </div>
    );
}

CalendarDays.propTypes = { ...CalendarPanelTypes };
