import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { COUNTRIES, CountryData, getCountriesSortedByLanguage } from '../../lib/countries';
import { Language, getTranslation } from '../../lib/translations';

export interface SelectedCountry {
  code: string;
  name: string;
  flagUrl: string;
}

interface CountrySelectorProps {
  value: SelectedCountry | null;
  onChange: (country: SelectedCountry) => void;
  language: Language;
}

export default function CountrySelector({ value, onChange, language }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sortedCountries = getCountriesSortedByLanguage(language);

  const filteredCountries = sortedCountries.filter(country =>
    country.names[language].toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: CountryData) => {
    onChange({
      code: country.code,
      name: country.names[language],
      flagUrl: country.flagUrl
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  const getDisplayName = () => {
    if (!value) return null;
    const country = COUNTRIES.find(c => c.code === value.code);
    if (country) {
      return country.names[language];
    }
    return value.name;
  };

  const placeholderText = {
    es: 'Seleccionar pais...',
    en: 'Select country...',
    it: 'Seleziona paese...'
  };

  const searchPlaceholder = {
    es: 'Buscar pais...',
    en: 'Search country...',
    it: 'Cerca paese...'
  };

  const noResultsText = {
    es: 'No se encontraron paises',
    en: 'No countries found',
    it: 'Nessun paese trovato'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img
              src={value.flagUrl}
              alt={getDisplayName() || value.name}
              className="w-8 h-6 object-cover rounded shadow-sm"
            />
            <span className="text-gray-900 font-medium">{getDisplayName()}</span>
          </div>
        ) : (
          <span className="text-gray-500">{placeholderText[language]}</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder[language]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              <div className="py-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                      value?.code === country.code ? 'bg-blue-100' : ''
                    }`}
                  >
                    <img
                      src={country.flagUrl}
                      alt={country.names[language]}
                      className="w-8 h-6 object-cover rounded shadow-sm"
                    />
                    <span className="text-gray-900 font-medium">{country.names[language]}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {noResultsText[language]}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { COUNTRIES };
export type { CountryData };
