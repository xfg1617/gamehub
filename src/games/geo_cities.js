/* Place names for the "Where Am I?" map (our own list). GEO_CITIES: [name, lat, lon, tier] - tier 1 shows when zoomed
   out a little, 2 when zoomed to a region, 3 when zoomed to a country. Capitals and big cities are tier 1.
   GEO_SEAS: [English, Vietnamese, lat, lon, tier]. GEO_VI: Vietnamese names for countries (others stay in English). */
window.GEO_CITIES = [
  // North America
  ['New York', 40.71, -74.01, 1], ['Los Angeles', 34.05, -118.24, 1], ['Chicago', 41.88, -87.63, 1], ['Washington', 38.9, -77.04, 1], ['Mexico City', 19.43, -99.13, 1], ['Toronto', 43.65, -79.38, 1],
  ['Houston', 29.76, -95.37, 2], ['Miami', 25.76, -80.19, 2], ['San Francisco', 37.77, -122.42, 2], ['Seattle', 47.61, -122.33, 2], ['Denver', 39.74, -104.99, 2], ['Atlanta', 33.75, -84.39, 2],
  ['Dallas', 32.78, -96.8, 2], ['Boston', 42.36, -71.06, 2], ['Phoenix', 33.45, -112.07, 2], ['Las Vegas', 36.17, -115.14, 2], ['New Orleans', 29.95, -90.07, 2], ['Vancouver', 49.28, -123.12, 2], ['Montreal', 45.5, -73.57, 2],
  ['Anchorage', 61.22, -149.9, 2], ['Honolulu', 21.31, -157.86, 2], ['Havana', 23.11, -82.37, 2], ['Guadalajara', 20.66, -103.35, 2], ['Calgary', 51.05, -114.07, 2], ['Ottawa', 45.42, -75.7, 2],
  ['Philadelphia', 39.95, -75.17, 3], ['Detroit', 42.33, -83.05, 3], ['Minneapolis', 44.98, -93.27, 3], ['St. Louis', 38.63, -90.2, 3], ['Kansas City', 39.1, -94.58, 3], ['Nashville', 36.16, -86.78, 3],
  ['Indianapolis', 39.77, -86.16, 3], ['Austin', 30.27, -97.74, 3], ['San Antonio', 29.42, -98.49, 3], ['San Diego', 32.72, -117.16, 3], ['Portland', 45.52, -122.68, 3], ['Salt Lake City', 40.76, -111.89, 3],
  ['Albuquerque', 35.08, -106.65, 3], ['Oklahoma City', 35.47, -97.52, 3], ['Memphis', 35.15, -90.05, 3], ['Charlotte', 35.23, -80.84, 3], ['Orlando', 28.54, -81.38, 3], ['Tampa', 27.95, -82.46, 3],
  ['Pittsburgh', 40.44, -80, 3], ['Cleveland', 41.5, -81.69, 3], ['Cincinnati', 39.1, -84.51, 3], ['Milwaukee', 43.04, -87.91, 3], ['Omaha', 41.26, -95.93, 3], ['Boise', 43.62, -116.2, 3],
  ['Billings', 45.78, -108.5, 3], ['Fargo', 46.88, -96.79, 3], ['El Paso', 31.76, -106.49, 3], ['Sacramento', 38.58, -121.49, 3], ['Raleigh', 35.78, -78.64, 3], ['Richmond', 37.54, -77.44, 3],
  ['Buffalo', 42.89, -78.88, 3], ['Savannah', 32.08, -81.09, 3], ['Charleston', 32.78, -79.93, 3], ['Louisville', 38.25, -85.76, 3], ['Santa Fe', 35.69, -105.94, 3], ['Tucson', 32.22, -110.97, 3],
  ['Spokane', 47.66, -117.43, 3], ['Des Moines', 41.59, -93.62, 3], ['Little Rock', 34.75, -92.29, 3], ['Jackson', 32.3, -90.18, 3], ['Birmingham', 33.52, -86.8, 3], ['Portland ME', 43.66, -70.26, 3],
  ['Monterrey', 25.69, -100.32, 3], ['Tijuana', 32.51, -117.04, 3], ['Cancún', 21.16, -86.85, 3], ['Winnipeg', 49.9, -97.14, 3], ['Edmonton', 53.55, -113.49, 3], ['Quebec City', 46.81, -71.21, 3],
  ['Halifax', 44.65, -63.57, 3], ['Guatemala City', 14.63, -90.51, 2], ['San José', 9.93, -84.08, 3], ['Panama City', 8.98, -79.52, 2], ['Kingston', 17.97, -76.79, 3], ['Santo Domingo', 18.49, -69.93, 3], ['San Juan', 18.47, -66.11, 3],
  // South America
  ['São Paulo', -23.55, -46.63, 1], ['Buenos Aires', -34.6, -58.38, 1], ['Rio de Janeiro', -22.91, -43.17, 1], ['Lima', -12.05, -77.04, 1], ['Bogotá', 4.71, -74.07, 1], ['Santiago', -33.45, -70.67, 1],
  ['Caracas', 10.48, -66.9, 2], ['Quito', -0.18, -78.47, 2], ['La Paz', -16.5, -68.15, 2], ['Brasília', -15.79, -47.88, 2], ['Montevideo', -34.9, -56.16, 2], ['Asunción', -25.26, -57.58, 2],
  ['Manaus', -3.12, -60.02, 2], ['Salvador', -12.97, -38.5, 3], ['Recife', -8.05, -34.88, 3], ['Medellín', 6.24, -75.58, 3], ['Cusco', -13.53, -71.97, 3], ['Córdoba', -31.42, -64.18, 3], ['Ushuaia', -54.8, -68.3, 3], ['Guayaquil', -2.17, -79.92, 3],
  // Europe
  ['London', 51.51, -0.13, 1], ['Paris', 48.86, 2.35, 1], ['Moscow', 55.76, 37.62, 1], ['Rome', 41.9, 12.5, 1], ['Madrid', 40.42, -3.7, 1], ['Berlin', 52.52, 13.4, 1], ['Istanbul', 41.01, 28.98, 1],
  ['Amsterdam', 52.37, 4.9, 2], ['Brussels', 50.85, 4.35, 2], ['Vienna', 48.21, 16.37, 2], ['Prague', 50.08, 14.44, 2], ['Warsaw', 52.23, 21.01, 2], ['Budapest', 47.5, 19.04, 2], ['Athens', 37.98, 23.73, 2],
  ['Lisbon', 38.72, -9.14, 2], ['Dublin', 53.35, -6.26, 2], ['Stockholm', 59.33, 18.07, 2], ['Oslo', 59.91, 10.75, 2], ['Copenhagen', 55.68, 12.57, 2], ['Helsinki', 60.17, 24.94, 2], ['Kyiv', 50.45, 30.52, 2],
  ['Bucharest', 44.43, 26.1, 2], ['Reykjavík', 64.15, -21.94, 2], ['Barcelona', 41.39, 2.17, 2], ['Milan', 45.46, 9.19, 2], ['St. Petersburg', 59.93, 30.34, 2], ['Zurich', 47.38, 8.54, 3], ['Geneva', 46.2, 6.14, 3],
  ['Munich', 48.14, 11.58, 3], ['Hamburg', 53.55, 9.99, 3], ['Frankfurt', 50.11, 8.68, 3], ['Edinburgh', 55.95, -3.19, 3], ['Manchester', 53.48, -2.24, 3], ['Lyon', 45.76, 4.84, 3], ['Marseille', 43.3, 5.37, 3],
  ['Nice', 43.7, 7.27, 3], ['Venice', 45.44, 12.32, 3], ['Florence', 43.77, 11.26, 3], ['Naples', 40.85, 14.27, 3], ['Seville', 37.39, -5.98, 3], ['Valencia', 39.47, -0.38, 3], ['Porto', 41.15, -8.61, 3],
  ['Belgrade', 44.79, 20.45, 3], ['Sofia', 42.7, 23.32, 3], ['Zagreb', 45.81, 15.98, 3], ['Dubrovnik', 42.65, 18.09, 3], ['Kraków', 50.06, 19.94, 3], ['Riga', 56.95, 24.11, 3], ['Tallinn', 59.44, 24.75, 3],
  ['Vilnius', 54.69, 25.28, 3], ['Minsk', 53.9, 27.56, 3], ['Bergen', 60.39, 5.32, 3], ['Gothenburg', 57.71, 11.97, 3], ['Bratislava', 48.15, 17.11, 3], ['Ljubljana', 46.06, 14.51, 3], ['Valletta', 35.9, 14.51, 3],
  // Africa & Middle East
  ['Cairo', 30.04, 31.24, 1], ['Lagos', 6.52, 3.38, 1], ['Johannesburg', -26.2, 28.05, 1], ['Nairobi', -1.29, 36.82, 1], ['Kinshasa', -4.44, 15.27, 1], ['Dubai', 25.2, 55.27, 1], ['Tehran', 35.69, 51.39, 1],
  ['Riyadh', 24.71, 46.68, 1], ['Casablanca', 33.57, -7.59, 2], ['Cape Town', -33.92, 18.42, 2], ['Addis Ababa', 9.03, 38.74, 2], ['Accra', 5.6, -0.19, 2], ['Dakar', 14.72, -17.47, 2], ['Algiers', 36.75, 3.06, 2],
  ['Tunis', 36.81, 10.18, 2], ['Khartoum', 15.5, 32.56, 2], ['Dar es Salaam', -6.79, 39.21, 2], ['Luanda', -8.84, 13.23, 2], ['Antananarivo', -18.88, 47.51, 2], ['Baghdad', 33.31, 44.36, 2], ['Jerusalem', 31.77, 35.21, 2],
  ['Amman', 31.95, 35.93, 3], ['Beirut', 33.89, 35.5, 3], ['Doha', 25.29, 51.53, 3], ['Muscat', 23.59, 58.41, 3], ['Marrakesh', 31.63, -8.01, 3], ['Abuja', 9.08, 7.4, 3], ['Kampala', 0.35, 32.58, 3],
  ['Kigali', -1.95, 30.06, 3], ['Lusaka', -15.39, 28.32, 3], ['Harare', -17.83, 31.05, 3], ['Maputo', -25.97, 32.57, 3], ['Durban', -29.86, 31.02, 3], ['Windhoek', -22.56, 17.08, 3], ['Zanzibar', -6.17, 39.2, 3],
  // Asia
  ['Tokyo', 35.68, 139.69, 1], ['Beijing', 39.9, 116.41, 1], ['Shanghai', 31.23, 121.47, 1], ['Delhi', 28.61, 77.21, 1], ['Mumbai', 19.08, 72.88, 1], ['Seoul', 37.57, 126.98, 1], ['Bangkok', 13.76, 100.5, 1],
  ['Jakarta', -6.21, 106.85, 1], ['Manila', 14.6, 120.98, 1], ['Singapore', 1.35, 103.82, 1], ['Hong Kong', 22.32, 114.17, 1], ['Hà Nội', 21.03, 105.85, 1], ['TP. Hồ Chí Minh', 10.78, 106.7, 1],
  ['Karachi', 24.86, 67.01, 2], ['Dhaka', 23.81, 90.41, 2], ['Kolkata', 22.57, 88.36, 2], ['Chennai', 13.08, 80.27, 2], ['Bengaluru', 12.97, 77.59, 2], ['Kuala Lumpur', 3.14, 101.69, 2], ['Taipei', 25.03, 121.57, 2],
  ['Osaka', 34.69, 135.5, 2], ['Kathmandu', 27.72, 85.32, 2], ['Colombo', 6.93, 79.86, 2], ['Yangon', 16.84, 96.17, 2], ['Phnom Penh', 11.56, 104.93, 2], ['Vientiane', 17.98, 102.63, 2], ['Kabul', 34.56, 69.21, 2],
  ['Tashkent', 41.3, 69.24, 2], ['Almaty', 43.24, 76.89, 2], ['Ulaanbaatar', 47.89, 106.91, 2], ['Chengdu', 30.57, 104.07, 2], ['Guangzhou', 23.13, 113.26, 2], ['Islamabad', 33.68, 73.05, 2], ['Novosibirsk', 55.01, 82.93, 2],
  ['Vladivostok', 43.12, 131.89, 2], ['Kyoto', 35.01, 135.77, 3], ['Sapporo', 43.06, 141.35, 3], ['Busan', 35.18, 129.08, 3], ['Xi\'an', 34.34, 108.94, 3], ['Kunming', 25.04, 102.71, 3], ['Lhasa', 29.65, 91.14, 3],
  ['Hangzhou', 30.27, 120.16, 3], ['Wuhan', 30.59, 114.31, 3], ['Chongqing', 29.56, 106.55, 3], ['Harbin', 45.8, 126.53, 3], ['Macau', 22.2, 113.54, 3], ['Chiang Mai', 18.79, 98.98, 3], ['Phuket', 7.88, 98.39, 3],
  ['Siem Reap', 13.36, 103.86, 3], ['Luang Prabang', 19.89, 102.13, 3], ['Mandalay', 21.97, 96.08, 3], ['Bali', -8.65, 115.22, 3], ['Cebu', 10.32, 123.89, 3], ['Penang', 5.41, 100.33, 3], ['Goa', 15.5, 73.83, 3],
  ['Jaipur', 26.91, 75.79, 3], ['Agra', 27.18, 78.01, 3], ['Varanasi', 25.32, 82.97, 3], ['Hyderabad', 17.39, 78.49, 3], ['Lahore', 31.55, 74.34, 3], ['Samarkand', 39.65, 66.96, 3], ['Bishkek', 42.87, 74.59, 3],
  // Vietnam (shown more when zoomed in on Vietnam)
  ['Hải Phòng', 20.84, 106.69, 2], ['Đà Nẵng', 16.05, 108.21, 2], ['Huế', 16.46, 107.59, 2], ['Cần Thơ', 10.03, 105.78, 2], ['Nha Trang', 12.24, 109.19, 2], ['Đà Lạt', 11.94, 108.44, 2],
  ['Hạ Long', 20.95, 107.08, 3], ['Hội An', 15.88, 108.33, 3], ['Vinh', 18.68, 105.68, 3], ['Thanh Hóa', 19.81, 105.78, 3], ['Nam Định', 20.43, 106.16, 3], ['Ninh Bình', 20.25, 105.97, 3],
  ['Sa Pa', 22.34, 103.84, 3], ['Lào Cai', 22.49, 103.97, 3], ['Hà Giang', 22.82, 104.98, 3], ['Cao Bằng', 22.67, 106.26, 3], ['Lạng Sơn', 21.85, 106.76, 3], ['Điện Biên Phủ', 21.39, 103.02, 3],
  ['Sơn La', 21.33, 103.91, 3], ['Thái Nguyên', 21.59, 105.85, 3], ['Bắc Ninh', 21.19, 106.08, 3], ['Đồng Hới', 17.47, 106.6, 3], ['Đông Hà', 16.82, 107.1, 3], ['Quảng Ngãi', 15.12, 108.8, 3],
  ['Quy Nhơn', 13.78, 109.22, 3], ['Tuy Hòa', 13.09, 109.3, 3], ['Pleiku', 13.98, 108.0, 3], ['Kon Tum', 14.35, 108.0, 3], ['Buôn Ma Thuột', 12.67, 108.04, 3], ['Phan Thiết', 10.93, 108.1, 3],
  ['Mũi Né', 10.93, 108.29, 3], ['Vũng Tàu', 10.35, 107.08, 3], ['Biên Hòa', 10.95, 106.82, 3], ['Thủ Dầu Một', 10.98, 106.65, 3], ['Mỹ Tho', 10.36, 106.36, 3], ['Long Xuyên', 10.39, 105.44, 3],
  ['Châu Đốc', 10.71, 105.12, 3], ['Rạch Giá', 10.01, 105.08, 3], ['Cà Mau', 9.18, 105.15, 3], ['Sóc Trăng', 9.6, 105.97, 3], ['Bạc Liêu', 9.29, 105.72, 3], ['Phú Quốc', 10.23, 103.96, 3],
  ['Côn Đảo', 8.69, 106.61, 3], ['Phan Rang', 11.57, 108.99, 3], ['Tây Ninh', 11.31, 106.1, 3], ['Hòa Bình', 20.82, 105.34, 3], ['Mai Châu', 20.66, 105.08, 3], ['Móng Cái', 21.53, 107.97, 3],
  // Oceania
  ['Sydney', -33.87, 151.21, 1], ['Melbourne', -37.81, 144.96, 1], ['Auckland', -36.85, 174.76, 1], ['Perth', -31.95, 115.86, 2], ['Brisbane', -27.47, 153.03, 2], ['Adelaide', -34.93, 138.6, 2],
  ['Darwin', -12.46, 130.84, 2], ['Wellington', -41.29, 174.78, 2], ['Canberra', -35.28, 149.13, 3], ['Hobart', -42.88, 147.33, 3], ['Cairns', -16.92, 145.77, 3], ['Alice Springs', -23.7, 133.88, 3],
  ['Christchurch', -43.53, 172.64, 3], ['Queenstown', -45.03, 168.66, 3], ['Suva', -18.14, 178.44, 3], ['Port Moresby', -9.44, 147.18, 3], ['Nouméa', -22.27, 166.46, 3], ['Papeete', -17.53, -149.57, 3],
];
window.GEO_SEAS = [
  ['Pacific Ocean', 'Thái Bình Dương', 5, -150, 0], ['Pacific Ocean', 'Thái Bình Dương', 15, 165, 0], ['Atlantic Ocean', 'Đại Tây Dương', 25, -45, 0], ['Atlantic Ocean', 'Đại Tây Dương', -20, -20, 0],
  ['Indian Ocean', 'Ấn Độ Dương', -20, 78, 0], ['Arctic Ocean', 'Bắc Băng Dương', 80, 10, 0], ['Southern Ocean', 'Nam Đại Dương', -60, 90, 0],
  ['Mediterranean Sea', 'Địa Trung Hải', 34.5, 18, 1], ['Caribbean Sea', 'Biển Caribe', 15, -75, 1], ['Gulf of Mexico', 'Vịnh Mexico', 25, -90, 1], ['East Sea', 'Biển Đông', 13, 113, 1],
  ['Philippine Sea', 'Biển Philippines', 20, 130, 1], ['Sea of Japan', 'Biển Nhật Bản', 40, 135, 2], ['Yellow Sea', 'Hoàng Hải', 35.5, 123, 2], ['East China Sea', 'Biển Hoa Đông', 29, 125, 2],
  ['Bay of Bengal', 'Vịnh Bengal', 15, 88, 1], ['Arabian Sea', 'Biển Ả Rập', 15, 64, 1], ['Red Sea', 'Biển Đỏ', 20, 38.5, 2], ['Persian Gulf', 'Vịnh Ba Tư', 27, 51, 2], ['Black Sea', 'Biển Đen', 43, 34, 1],
  ['Caspian Sea', 'Biển Caspi', 42, 50.5, 1], ['North Sea', 'Biển Bắc', 56, 3, 1], ['Baltic Sea', 'Biển Baltic', 57.5, 19, 2], ['Gulf of Thailand', 'Vịnh Thái Lan', 10, 101.5, 2],
  ['Gulf of Tonkin', 'Vịnh Bắc Bộ', 19.8, 107.5, 2], ['Coral Sea', 'Biển San Hô', -18, 155, 1], ['Tasman Sea', 'Biển Tasman', -38, 160, 1], ['Bering Sea', 'Biển Bering', 58, -178, 1],
  ['Gulf of Alaska', 'Vịnh Alaska', 57, -145, 2], ['Hudson Bay', 'Vịnh Hudson', 60, -85, 1], ['Gulf of Guinea', 'Vịnh Guinea', 2, 3, 2], ['Great Lakes', 'Ngũ Đại Hồ', 45.5, -84, 2],
];
window.GEO_VI = { 'United States of America': 'Hoa Kỳ', Canada: 'Canada', Mexico: 'Mexico', Brazil: 'Brazil', Argentina: 'Argentina', Chile: 'Chile', Peru: 'Peru', Colombia: 'Colombia',
  'United Kingdom': 'Anh', France: 'Pháp', Germany: 'Đức', Italy: 'Ý', Spain: 'Tây Ban Nha', Portugal: 'Bồ Đào Nha', Netherlands: 'Hà Lan', Belgium: 'Bỉ', Switzerland: 'Thụy Sĩ', Austria: 'Áo',
  Poland: 'Ba Lan', Czechia: 'Séc', Hungary: 'Hungary', Greece: 'Hy Lạp', Sweden: 'Thụy Điển', Norway: 'Na Uy', Finland: 'Phần Lan', Denmark: 'Đan Mạch', Ireland: 'Ireland', Iceland: 'Iceland',
  Russia: 'Nga', Ukraine: 'Ukraina', Turkey: 'Thổ Nhĩ Kỳ', Egypt: 'Ai Cập', Morocco: 'Ma-rốc', 'South Africa': 'Nam Phi', Nigeria: 'Nigeria', Kenya: 'Kenya', Ethiopia: 'Ethiopia',
  'Saudi Arabia': 'Ả Rập Xê Út', Iran: 'Iran', Iraq: 'Iraq', Israel: 'Israel', India: 'Ấn Độ', Pakistan: 'Pakistan', China: 'Trung Quốc', Japan: 'Nhật Bản', 'South Korea': 'Hàn Quốc',
  'North Korea': 'Triều Tiên', Mongolia: 'Mông Cổ', Vietnam: 'Việt Nam', Laos: 'Lào', Cambodia: 'Campuchia', Thailand: 'Thái Lan', Myanmar: 'Myanmar', Malaysia: 'Malaysia', Singapore: 'Singapore',
  Indonesia: 'Indonesia', Philippines: 'Philippines', Taiwan: 'Đài Loan', Australia: 'Úc', 'New Zealand': 'New Zealand', Kazakhstan: 'Kazakhstan', Nepal: 'Nepal', Bangladesh: 'Bangladesh', 'Sri Lanka': 'Sri Lanka',
  Cuba: 'Cuba', Greenland: 'Greenland', Algeria: 'Algeria', Libya: 'Libya', Sudan: 'Sudan', 'Dem. Rep. Congo': 'CHDC Congo', Tanzania: 'Tanzania', Madagascar: 'Madagascar', Afghanistan: 'Afghanistan',
  'United Arab Emirates': 'UAE', Romania: 'Romania', Croatia: 'Croatia' };
window.GEO_SHORT = { 'United States of America': 'United States', 'Dem. Rep. Congo': 'DR Congo', 'Central African Rep.': 'C. African Rep.', 'Bosnia and Herz.': 'Bosnia', 'Dominican Rep.': 'Dominican Rep.' };
