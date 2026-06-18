import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLanguage = event.target.value;
        i18n.changeLanguage(selectedLanguage);
    };

    return (
        <div className="relative inline-block text-left">
            <select
                // i18n.language current language track karta hai
                value={i18n.language || 'en'}
                onChange={changeLanguage}
                className="block w-18 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-colors cursor-pointer"
            >
                <option value="en">EN</option>
                <option value="sl">SL</option>
            </select>
        </div>
    );
};

export default LanguageSelector;