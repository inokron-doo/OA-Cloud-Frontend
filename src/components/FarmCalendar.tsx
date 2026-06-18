import config from "../config";

function FarmCalendar() {
    return (
        <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
            <iframe
                src={config.FARM_CALENDAR_URL}
                title="Farm Calendar"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
            ></iframe>
        </div>
    )
}

export default FarmCalendar
