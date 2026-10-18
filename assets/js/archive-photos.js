/**
 * ============================================================================
 * THE SOSA ARCHIVE — Tag-Driven Historical Photographic Repository
 * Module: assets/js/archive-photos.js
 * Architecture: Vanilla ES6+, Metadata-First Many-to-Many Figure Indexing
 * ============================================================================
 */

(() => {
    'use strict';

    const MANIFEST_URL = 'assets/data/archive_photos.json';

    // Embedded fallback manifest (ensures full functionality even under file:// protocol)
    const FALLBACK_MANIFEST = {
        figures: [
            {
                id: "che-guevara",
                name: "Ernesto 'Che' Guevara",
                birth_date: "June 14, 1928",
                death_date: "October 9, 1967",
                portrait: "https://assets.sosaspeaks.org/sosa-archive/portraits/che_guevara_guerrillero_heroico.jpg",
                era_context: "Cuban Revolution & Internationalist Campaigns",
                default_order: 1
            },
            {
                id: "fidel-castro",
                name: "Fidel Castro",
                birth_date: "August 13, 1926",
                death_date: "November 25, 2016",
                portrait: "https://assets.sosaspeaks.org/sosa-archive/portraits/fidel_castro_1977.jpg",
                era_context: "The Cuban Revolutionary State & International Endeavors",
                default_order: 2
            },
            {
                id: "mao-zedong",
                name: "Mao Zedong",
                birth_date: "December 26, 1893",
                death_date: "September 9, 1976",
                portrait: "https://assets.sosaspeaks.org/portraits/mao-zedong.jpg",
                era_context: "Chinese Communist Revolution & Early PRC Era",
                default_order: 3
            },
            {
                id: "vladimir-lenin",
                name: "Vladimir Ilyich Lenin",
                birth_date: "April 22, 1870",
                death_date: "January 21, 1924",
                portrait: "https://assets.sosaspeaks.org/portraits/vladimir-lenin.jpg",
                era_context: "October Revolution & Early Bolshevik Governance",
                default_order: 4
            },
            {
                id: "thomas-sankara",
                name: "Thomas Sankara",
                birth_date: "December 21, 1949",
                death_date: "October 15, 1987",
                portrait: "https://assets.sosaspeaks.org/portraits/thomas-sankara.jpg",
                era_context: "Burkinabé Revolution & Pan-African Anti-Imperialism",
                default_order: 5
            },
            {
                id: "joseph-stalin",
                name: "Joseph Stalin",
                birth_date: "December 18, 1878",
                death_date: "March 5, 1953",
                portrait: "https://assets.sosaspeaks.org/portraits/joseph-stalin.jpg",
                era_context: "Soviet Industrialization, Great Patriotic War & Cold War Origins",
                default_order: 6
            },
            {
                id: "kim-il-sung",
                name: "Kim Il Sung",
                birth_date: "April 15, 1912",
                death_date: "July 8, 1994",
                portrait: "https://assets.sosaspeaks.org/portraits/kim-il-sung.jpg",
                era_context: "Anti-Japanese Guerrilla Struggle & Founding of the DPRK",
                default_order: 7
            },
            {
                id: "kim-jong-il",
                name: "Kim Jong Il",
                birth_date: "February 16, 1941",
                death_date: "December 17, 2011",
                portrait: "https://assets.sosaspeaks.org/portraits/kim-jong-il.jpg",
                era_context: "Songun State Consolidation & Late Cold War DPRK",
                default_order: 8
            },
            {
                id: "hugo-chavez",
                name: "Hugo Chávez",
                birth_date: "July 28, 1954",
                death_date: "March 5, 2013",
                portrait: "https://assets.sosaspeaks.org/portraits/hugo-chavez.jpg",
                era_context: "Bolivarian Revolution & 21st-Century Latin American Socialism",
                default_order: 9
            },
            {
                id: "yukio-mishima",
                name: "Yukio Mishima",
                birth_date: "January 14, 1925",
                death_date: "November 25, 1970",
                portrait: "https://assets.sosaspeaks.org/portraits/yukio-mishima.jpg",
                era_context: "Postwar Japanese Literary Modernism & the Tatenokai",
                default_order: 10
            },
            {
                id: "franklin-d-roosevelt",
                name: "Franklin D. Roosevelt",
                birth_date: "January 30, 1882",
                death_date: "April 12, 1945",
                portrait: "https://assets.sosaspeaks.org/portraits/franklin-d-roosevelt.jpg",
                era_context: "The New Deal Coalition & Allied Grand Strategy in WWII",
                default_order: 11
            },
            {
                id: "minerva-mirabal",
                name: "Minerva Mirabal",
                birth_date: "March 12, 1926",
                death_date: "November 25, 1960",
                portrait: "https://assets.sosaspeaks.org/portraits/minerva-mirabal.jpg",
                era_context: "14th of June Revolutionary Movement & Anti-Trujillo Resistance",
                default_order: 12
            }
        ],
        photos: [
            {
                id: "che_guatemala_passport_1953",
                title: "Early Andean & Central American Travels",
                url: "https://assets.sosaspeaks.org/photos/che_guatemala_passport_1953.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_guatemala_passport_1953.jpg",
                year: 1953,
                precise_date: "December 24, 1953",
                location: "Guatemala City, Guatemala",
                description: "Archival portrait of Ernesto Guevara shortly after his arrival in Guatemala during the Jacobo Árbenz agrarian reform period, prior to his enlistment in the Cuban expeditionary forces.",
                source: "Centro de Estudios Che Guevara / Havana State Archive",
                tags: ["che-guevara"]
            },
            {
                id: "sierra_maestra_encampment_1957",
                title: "Rebel Command in the Sierra Maestra",
                url: "https://assets.sosaspeaks.org/photos/sierra_maestra_encampment_1957.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/sierra_maestra_encampment_1957.jpg",
                year: 1957,
                precise_date: "June 1957",
                location: "Sierra Maestra, Oriente Province, Cuba",
                description: "Fidel Castro and Che Guevara conferring over topographical maps at the rebel mountain headquarters during the guerrilla campaign against the Batista regime.",
                source: "26th of July Movement Field Archive / Enrique Meneses",
                tags: ["che-guevara", "fidel-castro"]
            },
            {
                id: "che_santa_clara_1958",
                title: "Aftermath of the Battle of Santa Clara",
                url: "https://assets.sosaspeaks.org/photos/che_santa_clara_1958.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_santa_clara_1958.jpg",
                year: 1958,
                precise_date: "December 31, 1958",
                location: "Santa Clara, Villa Clara, Cuba",
                description: "Column 8 rebel fighters led by Commander Ernesto 'Che' Guevara beside the derailed armored reinforcement train (Tren Blindado) that sealed the collapse of Fulgencio Batista's government.",
                source: "Archivo Histórico Provincial de Villa Clara",
                tags: ["che-guevara"]
            },
            {
                id: "che_fidel_havana_1959",
                title: "Triumphal Entry into Havana",
                url: "https://assets.sosaspeaks.org/photos/che_fidel_havana_1959.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_fidel_havana_1959.jpg",
                year: 1959,
                precise_date: "January 8, 1959",
                location: "Havana, Cuba",
                description: "Fidel Castro and Che Guevara during the triumphal entry of the 26th of July Movement into Havana.",
                source: "Bohemia Magazine Archive / Alberto Korda",
                tags: ["che-guevara", "fidel-castro"]
            },
            {
                id: "che_korda_guerrillero_1960",
                title: "Guerrillero Heroico (La Coubre Memorial)",
                url: "https://assets.sosaspeaks.org/photos/che_korda_guerrillero_1960.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_korda_guerrillero_1960.jpg",
                year: 1960,
                precise_date: "March 5, 1960",
                location: "Havana, Cuba",
                description: "Uncropped contact frame of Che Guevara on the speaker's platform at the funeral service for victims of the La Coubre freighter explosion in Havana Harbor.",
                source: "Revolución Newspaper Archive / Alberto Díaz Gutiérrez (Korda)",
                tags: ["che-guevara", "fidel-castro"]
            },
            {
                id: "che_mao_beijing_1960",
                title: "Cuban Economic Delegation in Beijing",
                url: "https://assets.sosaspeaks.org/photos/che_mao_beijing_1960.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_mao_beijing_1960.jpg",
                year: 1960,
                precise_date: "November 19, 1960",
                location: "Zhongnanhai, Beijing, China",
                description: "Chairman Mao Zedong welcomes Ernesto 'Che' Guevara, then President of the National Bank of Cuba, during a bilateral diplomatic mission to the People's Republic of China.",
                source: "Xinhua News Agency Historical Photo Repository",
                tags: ["che-guevara", "mao-zedong"]
            },
            {
                id: "che_pyongyang_visit_1960",
                title: "Cuban Diplomatic Mission to Pyongyang",
                url: "https://assets.sosaspeaks.org/photos/che_pyongyang_visit_1960.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_pyongyang_visit_1960.jpg",
                year: 1960,
                precise_date: "December 1960",
                location: "Pyongyang, North Korea",
                description: "Premier Kim Il Sung receives Commander Ernesto 'Che' Guevara in Pyongyang during the Cuban economic delegation's tour of socialist states.",
                source: "Korean Central News Agency (KCNA) Historical Archive",
                tags: ["che-guevara", "kim-il-sung"]
            },
            {
                id: "che_un_general_assembly_1964",
                title: "Address to the United Nations General Assembly",
                url: "https://assets.sosaspeaks.org/photos/che_un_general_assembly_1964.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_un_general_assembly_1964.jpg",
                year: 1964,
                precise_date: "December 11, 1964",
                location: "New York City, United States",
                description: "Representing Cuba at the 19th Session of the UN General Assembly, Che Guevara delivers a sweeping critique of neo-colonial intervention in the Congo and Latin America.",
                source: "United Nations Audiovisual Library",
                tags: ["che-guevara"]
            },
            {
                id: "che_bolivia_diary_camp_1967",
                title: "Ñancahuazú Expeditionary Column",
                url: "https://assets.sosaspeaks.org/photos/che_bolivia_diary_camp_1967.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/che_bolivia_diary_camp_1967.jpg",
                year: 1967,
                precise_date: "August 1967",
                location: "Santa Cruz Department, Bolivia",
                description: "One of the final surviving field negatives recovered from the Ñancahuazú guerrilla campaign in southeastern Bolivia prior to October 1967.",
                source: "Bolivian National Archive / Field Film Roll IV",
                tags: ["che-guevara"]
            },
            {
                id: "fidel_moncada_deposition_1953",
                title: "Arrest Following the Moncada Barracks Assault",
                url: "https://assets.sosaspeaks.org/photos/fidel_moncada_deposition_1953.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/fidel_moncada_deposition_1953.jpg",
                year: 1953,
                precise_date: "July 26, 1953",
                location: "Santiago de Cuba, Cuba",
                description: "Young attorney Fidel Castro in military custody after the July 26th attack on the Moncada Barracks, weeks before delivering his 'History Will Absolve Me' defense speech.",
                source: "Oficina de Asuntos Históricos del Consejo de Estado",
                tags: ["fidel-castro"]
            },
            {
                id: "fidel_sankara_nonaligned_1986",
                title: "8th Summit of the Non-Aligned Movement",
                url: "https://assets.sosaspeaks.org/photos/fidel_sankara_nonaligned_1986.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/fidel_sankara_nonaligned_1986.jpg",
                year: 1986,
                precise_date: "September 3, 1986",
                location: "Harare, Zimbabwe",
                description: "Burkinabé President Thomas Sankara and Fidel Castro meet on the sidelines of the Non-Aligned Movement summit to coordinate educational and medical exchanges between Havana and Ouagadougou.",
                source: "Prensa Latina Historical Archive",
                tags: ["fidel-castro", "thomas-sankara"]
            },
            {
                id: "mao_yanan_cave_1938",
                title: "Drafting 'On Protracted War' in Yan'an",
                url: "https://assets.sosaspeaks.org/photos/mao_yanan_cave_1938.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mao_yanan_cave_1938.jpg",
                year: 1938,
                precise_date: "May 1938",
                location: "Yan'an, Shaanxi Province, China",
                description: "Mao Zedong working by kerosene lamp inside a yaodong cave dwelling at the Shaan-Gan-Ning Base Area following the Long March.",
                source: "Yan'an Revolutionary Memorial Hall Archive / Wu Yinxian",
                tags: ["mao-zedong"]
            },
            {
                id: "mao_proclamation_prc_1949",
                title: "Proclamation of the People's Republic of China",
                url: "https://assets.sosaspeaks.org/photos/mao_proclamation_prc_1949.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mao_proclamation_prc_1949.jpg",
                year: 1949,
                precise_date: "October 1, 1949",
                location: "Tiananmen Rostrum, Beijing, China",
                description: "Chairman Mao Zedong addresses the founding ceremony atop the Gate of Heavenly Peace, formally inaugurating the Central People's Government.",
                source: "Central Newsreel and Documentary Film Studio / Hou Bo",
                tags: ["mao-zedong"]
            },
            {
                id: "lenin_red_square_speech_1920",
                title: "Address to Red Army Troops Departing for the Polish Front",
                url: "https://assets.sosaspeaks.org/photos/lenin_red_square_speech_1920.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/lenin_red_square_speech_1920.jpg",
                year: 1920,
                precise_date: "May 5, 1920",
                location: "Sverdlov Square, Moscow, Soviet Russia",
                description: "Uncensored glass-plate negative of Vladimir Lenin delivering an outdoor oration from a wooden tribune during the Russian Civil War.",
                source: "Grigory Goldstein / Central State Archive of Cine-Photo Documents",
                tags: ["vladimir-lenin"]
            },
            {
                id: "lenin_stalin_gorki_1922",
                title: "Convalescence Discussions at Gorki Leninskiye",
                url: "https://assets.sosaspeaks.org/photos/lenin_stalin_gorki_1922.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/lenin_stalin_gorki_1922.jpg",
                year: 1922,
                precise_date: "August 1922",
                location: "Gorki, Moscow Governorate, Soviet Russia",
                description: "Vladimir Lenin and newly appointed General Secretary Joseph Stalin photographed on a garden bench at the Gorki estate by Maria Ilyinichna Ulyanova.",
                source: "Russian State Archive of Socio-Political History (RGASPI)",
                tags: ["vladimir-lenin", "joseph-stalin"]
            },
            {
                id: "sankara_ouagadougou_reforestation_1985",
                title: "Sahel Reforestation & Agrarian Self-Sufficiency Campaign",
                url: "https://assets.sosaspeaks.org/photos/sankara_ouagadougou_reforestation_1985.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/sankara_ouagadougou_reforestation_1985.jpg",
                year: 1985,
                precise_date: "April 1985",
                location: "Ouagadougou, Burkina Faso",
                description: "Captain Thomas Sankara participating in community tree-planting initiatives designed to halt desertification across the Sahel and achieve national food sovereignty.",
                source: "Sidwaya National Press Archive, Ouagadougou",
                tags: ["thomas-sankara"]
            },
            {
                id: "sankara_oau_addis_ababa_1987",
                title: "United Front Against Foreign Debt Speech at the OAU",
                url: "https://assets.sosaspeaks.org/photos/sankara_oau_addis_ababa_1987.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/sankara_oau_addis_ababa_1987.jpg",
                year: 1987,
                precise_date: "July 29, 1987",
                location: "Addis Ababa, Ethiopia",
                description: "Thomas Sankara addresses the 23rd Summit of the Organization of African Unity, urging African heads of state to form a collective front against neo-colonial debt servicing.",
                source: "Organization of African Unity Audiovisual Archive",
                tags: ["thomas-sankara"]
            },
            {
                id: "fdr_first_fireside_chat_1933",
                title: "First Fireside Chat on the Banking Crisis",
                url: "https://assets.sosaspeaks.org/photos/fdr_first_fireside_chat_1933.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/fdr_first_fireside_chat_1933.jpg",
                year: 1933,
                precise_date: "March 12, 1933",
                location: "The White House, Washington, D.C., United States",
                description: "President Franklin D. Roosevelt addresses the American public via national radio broadcast from the Diplomatic Reception Room to explain the Emergency Banking Act during the Great Depression.",
                source: "Franklin D. Roosevelt Presidential Library and Museum",
                tags: ["franklin-d-roosevelt"]
            },
            {
                id: "fdr_social_security_signing_1935",
                title: "Enactment of the Social Security Act",
                url: "https://assets.sosaspeaks.org/photos/fdr_social_security_signing_1935.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/fdr_social_security_signing_1935.jpg",
                year: 1935,
                precise_date: "August 14, 1935",
                location: "The White House, Washington, D.C., United States",
                description: "Franklin D. Roosevelt signs the Social Security Act into law alongside Labor Secretary Frances Perkins and congressional sponsors, anchoring the Second New Deal.",
                source: "Library of Congress / Harris & Ewing Collection",
                tags: ["franklin-d-roosevelt"]
            },
            {
                id: "stalin_fdr_tehran_conference_1943",
                title: "Tehran Conference — Opening of the Second Front",
                url: "https://assets.sosaspeaks.org/photos/stalin_fdr_tehran_conference_1943.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/stalin_fdr_tehran_conference_1943.jpg",
                year: 1943,
                precise_date: "November 28, 1943",
                location: "Soviet Embassy, Tehran, Iran",
                description: "Marshal Joseph Stalin, President Franklin D. Roosevelt, and Prime Minister Winston Churchill on the portico of the Soviet legation in Tehran after finalizing plans for Operation Overlord.",
                source: "U.S. National Archives and Records Administration (NARA)",
                tags: ["joseph-stalin", "franklin-d-roosevelt"]
            },
            {
                id: "stalin_fdr_yalta_livadia_1945",
                title: "Yalta Conference at Livadia Palace",
                url: "https://assets.sosaspeaks.org/photos/stalin_fdr_yalta_livadia_1945.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/stalin_fdr_yalta_livadia_1945.jpg",
                year: 1945,
                precise_date: "February 9, 1945",
                location: "Yalta, Crimea, Soviet Union",
                description: "Allied heads of government Joseph Stalin and Franklin D. Roosevelt in the courtyard of Livadia Palace negotiating the postwar reorganization of Europe and the United Nations charter.",
                source: "U.S. Army Signal Corps / Imperial War Museum Archive",
                tags: ["joseph-stalin", "franklin-d-roosevelt"]
            },
            {
                id: "stalin_mao_moscow_treaty_1949",
                title: "Sino-Soviet Treaty Negotiations in Moscow",
                url: "https://assets.sosaspeaks.org/photos/stalin_mao_moscow_treaty_1949.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/stalin_mao_moscow_treaty_1949.jpg",
                year: 1949,
                precise_date: "December 21, 1949",
                location: "Bolshoi Theatre, Moscow, Soviet Union",
                description: "Joseph Stalin and Chairman Mao Zedong on stage in Moscow during negotiations that culminated in the 1950 Sino-Soviet Treaty of Friendship, Alliance, and Mutual Assistance.",
                source: "TASS Photo Chronicle / RGASPI",
                tags: ["joseph-stalin", "mao-zedong"]
            },
            {
                id: "kim_il_sung_pyongyang_liberation_1945",
                title: "Pyongyang Municipal Rally Welcoming the Anti-Japanese Guerrillas",
                url: "https://assets.sosaspeaks.org/photos/kim_il_sung_pyongyang_liberation_1945.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/kim_il_sung_pyongyang_liberation_1945.jpg",
                year: 1945,
                precise_date: "October 14, 1945",
                location: "Pyongyang Public Stadium, Korea",
                description: "Kim Il Sung delivers his first public address in liberated Pyongyang following the defeat of Imperial Japan at the conclusion of the Second World War.",
                source: "Korean Revolution Museum Archive, Pyongyang",
                tags: ["kim-il-sung"]
            },
            {
                id: "kim_il_sung_mao_beijing_1958",
                title: "DPRK State Delegation in Beijing",
                url: "https://assets.sosaspeaks.org/photos/kim_il_sung_mao_beijing_1958.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/kim_il_sung_mao_beijing_1958.jpg",
                year: 1958,
                precise_date: "November 21, 1958",
                location: "Beijing, China",
                description: "Premier Kim Il Sung and Chairman Mao Zedong review the honor guard in Beijing following the withdrawal of the Chinese People's Volunteer Army after postwar reconstruction.",
                source: "Xinhua News Agency Historical Photo Repository",
                tags: ["kim-il-sung", "mao-zedong"]
            },
            {
                id: "kim_il_sung_kim_jong_il_paektu_1963",
                title: "On-the-Spot Guidance in Ryanggang Province",
                url: "https://assets.sosaspeaks.org/photos/kim_il_sung_kim_jong_il_paektu_1963.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/kim_il_sung_kim_jong_il_paektu_1963.jpg",
                year: 1963,
                precise_date: "August 1963",
                location: "Samjiyon, Ryanggang Province, North Korea",
                description: "Kim Il Sung and young Kim Jong Il surveying forestry and industrial construction sites near Mount Paektu during an inspection tour of the northern border region.",
                source: "Foreign Languages Publishing House Archive, Pyongyang",
                tags: ["kim-il-sung", "kim-jong-il"]
            },
            {
                id: "kim_il_sung_kim_jong_il_party_congress_1980",
                title: "6th Congress of the Workers' Party of Korea",
                url: "https://assets.sosaspeaks.org/photos/kim_il_sung_kim_jong_il_party_congress_1980.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/kim_il_sung_kim_jong_il_party_congress_1980.jpg",
                year: 1980,
                precise_date: "October 10, 1980",
                location: "February 8 House of Culture, Pyongyang, North Korea",
                description: "Kim Il Sung and Kim Jong Il on the presidium rostrum at the 6th WPK Congress, where Kim Jong Il was formally introduced as the party's designated successor.",
                source: "Rodong Sinmun Central Photo Archive",
                tags: ["kim-il-sung", "kim-jong-il"]
            },
            {
                id: "kim_jong_il_inter_korean_summit_2000",
                title: "Historic First Inter-Korean Summit in Pyongyang",
                url: "https://assets.sosaspeaks.org/photos/kim_jong_il_inter_korean_summit_2000.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/kim_jong_il_inter_korean_summit_2000.jpg",
                year: 2000,
                precise_date: "June 13, 2000",
                location: "Sunan International Airport, Pyongyang, North Korea",
                description: "National Defense Commission Chairman Kim Jong Il greets South Korean President Kim Dae-jung on the tarmac in Pyongyang ahead of the June 15th North–South Joint Declaration.",
                source: "Joint Press Corps / Presidential Archives of Korea",
                tags: ["kim-jong-il"]
            },
            {
                id: "minerva_mirabal_uasd_law_graduation_1957",
                title: "Summa Cum Laude Law Doctorate at the University of Santo Domingo",
                url: "https://assets.sosaspeaks.org/photos/minerva_mirabal_uasd_law_graduation_1957.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/minerva_mirabal_uasd_law_graduation_1957.jpg",
                year: 1957,
                precise_date: "October 1957",
                location: "Ciudad Trujillo (Santo Domingo), Dominican Republic",
                description: "Minerva Mirabal receives her Doctor of Law diploma as the first woman summa cum laude graduate in the Dominican Republic, though dictator Rafael Trujillo barred her from practicing law.",
                source: "Museo Memorial de la Resistencia Dominicana / Casa Museo Hermanas Mirabal",
                tags: ["minerva-mirabal"]
            },
            {
                id: "minerva_mirabal_1j4_clandestine_assembly_1960",
                title: "Founding of the 14th of June Revolutionary Movement (1J4)",
                url: "https://assets.sosaspeaks.org/photos/minerva_mirabal_1j4_clandestine_assembly_1960.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/minerva_mirabal_1j4_clandestine_assembly_1960.jpg",
                year: 1960,
                precise_date: "January 10, 1960",
                location: "Mao, Valverde Province, Dominican Republic",
                description: "Archival portrait of Minerva Mirabal ('La Mariposa'), principal ideologue and co-founder of the clandestine 14th of June Movement organized to overthrow the Trujillo dictatorship.",
                source: "Archivo General de la Nación (República Dominicana)",
                tags: ["minerva-mirabal"]
            },
            {
                id: "mishima_confessions_study_tokyo_1956",
                title: "Drafting 'The Temple of the Golden Pavilion' in Tokyo",
                url: "https://assets.sosaspeaks.org/photos/mishima_confessions_study_tokyo_1956.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mishima_confessions_study_tokyo_1956.jpg",
                year: 1956,
                precise_date: "1956",
                location: "Meguro, Tokyo, Japan",
                description: "Novelist and playwright Yukio Mishima photographed in his study during the composition of Kinkaku-ji (The Temple of the Golden Pavilion).",
                source: "Yukio Mishima Literary Museum Archive, Yamanakako",
                tags: ["yukio-mishima"]
            },
            {
                id: "mishima_barakei_hosoe_session_1961",
                title: "Barakei (Ordeal by Roses) Photographic Collaboration",
                url: "https://assets.sosaspeaks.org/photos/mishima_barakei_hosoe_session_1961.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mishima_barakei_hosoe_session_1961.jpg",
                year: 1961,
                precise_date: "Autumn 1961",
                location: "Magome, Ota Ward, Tokyo, Japan",
                description: "Yukio Mishima photographed at his neoclassical residence by avant-garde photographer Eikoh Hosoe for the landmark photobook Barakei.",
                source: "Eikoh Hosoe Photographic Archive / Tokyo Photographic Art Museum",
                tags: ["yukio-mishima"]
            },
            {
                id: "mishima_todai_zenkyoto_debate_1969",
                title: "Debate with the Todai Zenkyoto at the University of Tokyo",
                url: "https://assets.sosaspeaks.org/photos/mishima_todai_zenkyoto_debate_1969.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mishima_todai_zenkyoto_debate_1969.jpg",
                year: 1969,
                precise_date: "May 13, 1969",
                location: "Komaba Campus, University of Tokyo, Japan",
                description: "Yukio Mishima addresses over 1,000 New Left student radicals of the All-Campus Joint Struggle Committee (Zenkyoto) inside Lecture Hall 900.",
                source: "TBS / Shinchosha Historical Archive",
                tags: ["yukio-mishima"]
            },
            {
                id: "mishima_ichigaya_balcony_1970",
                title: "Address from the Eastern Command Balcony at Camp Ichigaya",
                url: "https://assets.sosaspeaks.org/photos/mishima_ichigaya_balcony_1970.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/mishima_ichigaya_balcony_1970.jpg",
                year: 1970,
                precise_date: "November 25, 1970",
                location: "Camp Ichigaya, Shinjuku, Tokyo, Japan",
                description: "Yukio Mishima, wearing the uniform of the Tatenokai (Shield Society), delivers his final manifesto to assembled Japan Self-Defense Forces personnel from the balcony of the Eastern Army headquarters.",
                source: "Mainichi Shimbun / Kyodo News Photo Archive",
                tags: ["yukio-mishima"]
            },
            {
                id: "chavez_fidel_havana_university_1994",
                title: "First Meeting of Fidel Castro and Hugo Chávez in Havana",
                url: "https://assets.sosaspeaks.org/photos/chavez_fidel_havana_university_1994.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/chavez_fidel_havana_university_1994.jpg",
                year: 1994,
                precise_date: "December 14, 1994",
                location: "Aula Magna, University of Havana, Cuba",
                description: "Fidel Castro welcomes Venezuelan Bolivarian movement leader Hugo Chávez to Havana shortly after Chávez's release from Yare prison, initiating a two-decade strategic alliance.",
                source: "Estudios Revolución / Archivo del Consejo de Estado de Cuba",
                tags: ["hugo-chavez", "fidel-castro"]
            },
            {
                id: "chavez_constituent_inauguration_1999",
                title: "Presidential Inauguration & Call for a Constituent Assembly",
                url: "https://assets.sosaspeaks.org/photos/chavez_constituent_inauguration_1999.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/chavez_constituent_inauguration_1999.jpg",
                year: 1999,
                precise_date: "February 2, 1999",
                location: "Palacio Federal Legislativo, Caracas, Venezuela",
                description: "Hugo Chávez takes the presidential oath of office in Caracas, signing the decree for a popular referendum to draft the 1999 Bolivarian Constitution.",
                source: "Archivo Audiovisual de la Biblioteca Nacional de Venezuela",
                tags: ["hugo-chavez"]
            },
            {
                id: "chavez_fidel_alba_signing_2004",
                title: "Founding of the Bolivarian Alliance for the Peoples of Our America (ALBA)",
                url: "https://assets.sosaspeaks.org/photos/chavez_fidel_alba_signing_2004.jpg",
                thumb_url: "https://assets.sosaspeaks.org/photos/thumbs/chavez_fidel_alba_signing_2004.jpg",
                year: 2004,
                precise_date: "December 14, 2004",
                location: "Palacio de la Revolución, Havana, Cuba",
                description: "Presidents Hugo Chávez and Fidel Castro sign the joint declaration establishing ALBA and the Barrio Adentro medical-energy cooperation accords.",
                source: "Prensa Presidencial de Venezuela / Granma Archive",
                tags: ["hugo-chavez", "fidel-castro"]
            }
        ]
    };

    // Optional local repository image mirrors for offline / pre-R2 previewing
    const LOCAL_ASSET_MIRRORS = {
        "mao-zedong": "assets/images/featured/preface-1.png",
        "vladimir-lenin": "assets/images/featured/lenin1.jpg",
        "alexandra-kollontai": "assets/images/featured/sovietwomen-iww.jpg",
        "huey-newton": "assets/images/featured/blackpanthers-sacramento.jpg",
        "panthers_sacramento_capitol_1967": "assets/images/featured/blackpanthers-sacramento.jpg",
        "kollontai_zhenotdel_congress_1918": "assets/images/featured/sovietwomen-iww.jpg",
        "lenin_red_square_speech_1920": "assets/images/featured/lenin1.jpg",
        "mao_proclamation_prc_1949": "assets/images/featured/preface-1.png"
    };

    // Application State
    const state = {
        figures: [],
        photos: [],
        figureStatsMap: new Map(), // figureId -> { photos, count, minYear, maxYear, timespan }
        figureById: new Map(),     // figureId -> figure object
        activeView: 'directory',   // 'directory' | 'timeline'
        activeFigureId: null,
        timelineSortOrder: 'asc',  // 'asc' | 'desc'
        directorySortBy: 'default', // 'default' | 'chrono' | 'count' | 'alpha'
        searchQuery: '',
        lightboxQueue: [],         // array of photo objects currently navigable in Lightbox
        lightboxIndex: -1
    };

    // DOM References
    const dom = {};

    function cacheDom() {
        dom.viewDirectory = document.getElementById('archive-view-directory');
        dom.viewTimeline = document.getElementById('archive-view-timeline');

        // Directory Controls & Containers
        dom.searchInput = document.getElementById('archive-search-input');
        dom.searchClearBtn = document.getElementById('archive-search-clear');
        dom.directorySortSelect = document.getElementById('archive-sort-select');
        dom.statFiguresCount = document.getElementById('stat-figures-count');
        dom.statPlatesCount = document.getElementById('stat-plates-count');
        dom.statSpanYears = document.getElementById('stat-span-years');
        dom.figuresGrid = document.getElementById('figures-grid');
        dom.directoryCaption = document.getElementById('directory-results-caption');
        dom.searchPlatesSection = document.getElementById('search-plates-section');
        dom.searchPlatesGrid = document.getElementById('search-plates-grid');
        dom.searchPlatesCaption = document.getElementById('search-plates-caption');

        // Timeline Controls & Containers
        dom.btnBackDirectory = document.getElementById('btn-back-directory');
        dom.timelinePortraitImg = document.getElementById('timeline-portrait-img');
        dom.timelineFigureName = document.getElementById('timeline-figure-name');
        dom.timelineFigureLifespan = document.getElementById('timeline-figure-lifespan');
        dom.timelineFigureEra = document.getElementById('timeline-figure-era');
        dom.timelineBadgeSpan = document.getElementById('timeline-badge-span');
        dom.timelineBadgeCount = document.getElementById('timeline-badge-count');
        dom.timelineCotaggedRow = document.getElementById('timeline-cotagged-row');
        dom.timelineYearJumps = document.getElementById('timeline-year-jumps');
        dom.btnSortAsc = document.getElementById('btn-sort-asc');
        dom.btnSortDesc = document.getElementById('btn-sort-desc');
        dom.timelineYearsContainer = document.getElementById('timeline-years-container');

        // Lightbox Document Viewer
        dom.lightbox = document.getElementById('archive-lightbox');
        dom.lightboxCloseBtn = document.getElementById('lightbox-close-btn');
        dom.lightboxFullscreenBtn = document.getElementById('lightbox-fullscreen-btn');
        dom.lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
        dom.lightboxNextBtn = document.getElementById('lightbox-next-btn');
        dom.lightboxImg = document.getElementById('lightbox-img');
        dom.lightboxCounter = document.getElementById('lightbox-counter');
        dom.dossierCatalogId = document.getElementById('dossier-catalog-id');
        dom.dossierTitle = document.getElementById('dossier-title');
        dom.dossierDate = document.getElementById('dossier-date');
        dom.dossierLocation = document.getElementById('dossier-location');
        dom.dossierSource = document.getElementById('dossier-source');
        dom.dossierDescription = document.getElementById('dossier-description');
        dom.dossierTagsList = document.getElementById('dossier-tags-list');
    }

    /**
     * Escapes HTML strings safely
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Generates a museum-grade SVG archival photo fallback if an R2 image is offline
     */
    function createArchivalFallbackSvg({ title, subtitle, year, catalogId, isPortrait = false }) {
        const w = isPortrait ? 600 : 800;
        const h = isPortrait ? 660 : 550;
        const safeTitle = escapeHtml(title || 'Archival Photo');
        const safeSub = escapeHtml(subtitle || 'The Sosa Archive');
        const safeYear = escapeHtml(year || 'ARCHIVE');
        const safeId = escapeHtml(catalogId || 'SOSA-PHOTO');

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
            <defs>
                <radialGradient id="bg" cx="50%" cy="35%" r="75%">
                    <stop offset="0%" stop-color="#193327"/>
                    <stop offset="55%" stop-color="#0e1c15"/>
                    <stop offset="100%" stop-color="#070e0a"/>
                </radialGradient>
                <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.45"/>
                    <stop offset="100%" stop-color="#047857" stop-opacity="0.1"/>
                </linearGradient>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#10b981" stroke-width="0.6" stroke-opacity="0.12"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            <rect x="22" y="22" width="${w - 44}" height="${h - 44}" rx="10" fill="none" stroke="url(#accent)" stroke-width="1.5"/>
            <rect x="30" y="30" width="${w - 60}" height="${h - 60}" rx="6" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
            <circle cx="${w / 2}" cy="${h * 0.42}" r="${isPortrait ? 88 : 74}" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-opacity="0.35" stroke-width="1.5"/>
            <text x="${w / 2}" y="${h * 0.435}" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="${isPortrait ? 34 : 32}" font-weight="bold" letter-spacing="3">${safeYear}</text>
            <text x="48" y="62" fill="#34d399" fill-opacity="0.8" font-family="monospace" font-size="13" letter-spacing="2">R2 // ${safeId}</text>
            <text x="${w / 2}" y="${h * 0.68}" text-anchor="middle" fill="#e6f4ec" font-family="sans-serif" font-size="22" font-weight="bold">${safeTitle}</text>
            <text x="${w / 2}" y="${h * 0.74}" text-anchor="middle" fill="#8da899" font-family="sans-serif" font-size="14">${safeSub}</text>
        </svg>`;

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    /**
     * Attaches resilient fallback handling to an <img> element:
     * 1. Attempts primary Cloudflare R2 URL (`https://assets.sosaspeaks.org/...`)
     * 2. If unreachable, checks local mirror if available
     * 3. Otherwise renders a custom SVG archival contact photo
     */
    function attachImageFallback(imgEl, fallbackConfig) {
        if (!imgEl) return;
        let triedLocalMirror = false;
        imgEl.addEventListener('error', () => {
            const mirrorPath = LOCAL_ASSET_MIRRORS[fallbackConfig.mirrorKey];
            if (!triedLocalMirror && mirrorPath) {
                triedLocalMirror = true;
                imgEl.src = mirrorPath;
                return;
            }
            if (!imgEl.dataset.fallbackApplied) {
                imgEl.dataset.fallbackApplied = 'true';
                imgEl.src = createArchivalFallbackSvg(fallbackConfig);
            }
        });
    }

    /**
     * Loads the JSON manifest from `assets/data/archive_photos.json` with fallback
     */
    async function loadManifest() {
        try {
            const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data.figures) && Array.isArray(data.photos)) {
                return data;
            }
        } catch (err) {
            console.info('[The Sosa Archive] Using embedded manifest fallback:', err.message);
        }
        return FALLBACK_MANIFEST;
    }

    /**
     * Builds the client-side relational index between figures and multi-tagged photos.
     * Calculates dynamic chronological timespan (`min(year)` – `max(year)`) and item count.
     */
    function indexArchiveData(manifest) {
        state.figures = [...manifest.figures].sort(
            (a, b) => (a.default_order ?? 999) - (b.default_order ?? 999)
        );
        state.photos = [...manifest.photos];
        state.figureById.clear();
        state.figureStatsMap.clear();

        state.figures.forEach(fig => {
            state.figureById.set(fig.id, fig);
            state.figureStatsMap.set(fig.id, {
                photos: [],
                count: 0,
                minYear: null,
                maxYear: null,
                timespan: 'Archival'
            });
        });

        // Associate each photo with every tagged figure (many-to-many)
        state.photos.forEach(photo => {
            if (!Array.isArray(photo.tags)) return;
            photo.tags.forEach(tagId => {
                const entry = state.figureStatsMap.get(tagId);
                if (entry) {
                    entry.photos.push(photo);
                }
            });
        });

        // Compute dynamic min(year), max(year), and timespan badge per figure
        state.figureStatsMap.forEach(entry => {
            entry.count = entry.photos.length;
            const validYears = entry.photos
                .map(p => Number(p.year))
                .filter(y => !Number.isNaN(y) && y > 0);

            if (validYears.length > 0) {
                entry.minYear = Math.min(...validYears);
                entry.maxYear = Math.max(...validYears);
                entry.timespan =
                    entry.minYear === entry.maxYear
                        ? `${entry.minYear}`
                        : `${entry.minYear} – ${entry.maxYear}`;
            } else {
                entry.timespan = 'Undated';
            }
        });
    }

    /**
     * Updates global repository summary pills in the Index View toolbar
     */
    function renderGlobalStats() {
        if (dom.statFiguresCount) {
            dom.statFiguresCount.textContent = `${state.figures.length} Figures`;
        }
        if (dom.statPlatesCount) {
            dom.statPlatesCount.textContent = `${state.photos.length} Photos`;
        }
        if (dom.statSpanYears) {
            const allYears = state.photos
                .map(p => Number(p.year))
                .filter(y => !Number.isNaN(y) && y > 0);
            if (allYears.length > 0) {
                const min = Math.min(...allYears);
                const max = Math.max(...allYears);
                dom.statSpanYears.textContent = `${min} – ${max}`;
            }
        }
    }

    /**
     * Formats photo title gracefully (uses `photo.title` if present, or derives from location & year)
     */
    function getPhotoTitle(photo) {
        if (photo.title && photo.title.trim()) {
            return photo.title.trim();
        }
        if (photo.location) {
            return `${photo.location} (${photo.year || 'Archival'})`;
        }
        return `Photo ${photo.id}`;
    }

    /**
     * Renders View 1: The Historical Directory (Figure Cards + Direct Photo Matches on Search)
     */
    function renderDirectoryView() {
        const query = state.searchQuery.trim().toLowerCase();

        // Filter figures matching query (or figures who appear in photos matching query)
        const matchingFigureIdsFromPhotos = new Set();
        const matchingPhotos = [];

        if (query) {
            state.photos.forEach(photo => {
                const tagNames = (photo.tags || [])
                    .map(tid => state.figureById.get(tid)?.name || tid)
                    .join(' ');
                const haystack = [
                    photo.id,
                    photo.title,
                    photo.description,
                    photo.location,
                    photo.source,
                    photo.precise_date,
                    String(photo.year),
                    tagNames
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                if (haystack.includes(query)) {
                    matchingPhotos.push(photo);
                    (photo.tags || []).forEach(tid => matchingFigureIdsFromPhotos.add(tid));
                }
            });
        }

        let filteredFigures = state.figures.filter(fig => {
            if (!query) return true;
            const hay = `${fig.name} ${fig.era_context} ${fig.id} ${fig.birth_date || ''} ${fig.death_date || ''}`.toLowerCase();
            return hay.includes(query) || matchingFigureIdsFromPhotos.has(fig.id);
        });

        // Sort figures according to active directory sort setting
        filteredFigures.sort((a, b) => {
            const statsA = state.figureStatsMap.get(a.id);
            const statsB = state.figureStatsMap.get(b.id);
            switch (state.directorySortBy) {
                case 'chrono':
                    return (statsA?.minYear ?? 9999) - (statsB?.minYear ?? 9999);
                case 'count':
                    return (statsB?.count ?? 0) - (statsA?.count ?? 0);
                case 'alpha':
                    return a.name.localeCompare(b.name);
                case 'default':
                default:
                    return (a.default_order ?? 999) - (b.default_order ?? 999);
            }
        });

        if (dom.directoryCaption) {
            dom.directoryCaption.textContent = query
                ? `Showing ${filteredFigures.length} of ${state.figures.length} figures`
                : `Ordered by archival index (${filteredFigures.length} figures)`;
        }

        dom.figuresGrid.innerHTML = '';

        if (filteredFigures.length === 0) {
            dom.figuresGrid.innerHTML = `
                <div class="archive-empty-state" style="grid-column: 1 / -1;">
                    <i class='bx bx-search-alt'></i>
                    <h3>No Matching Historical Figures or Photos</h3>
                    <p>No archival records matched "<strong>${escapeHtml(state.searchQuery)}</strong>". Try searching by name, year (e.g., 1959), city (e.g., Havana), or source.</p>
                </div>
            `;
        } else {
            filteredFigures.forEach(fig => {
                const stats = state.figureStatsMap.get(fig.id) || {
                    count: 0,
                    timespan: 'Archival'
                };
                const photoCountLabel =
                    stats.count === 1 ? '1 photo' : `${stats.count} photos`;

                const lifespanText =
                    fig.birth_date && fig.death_date
                        ? `${fig.birth_date} – ${fig.death_date}`
                        : fig.birth_date
                        ? `Born ${fig.birth_date}`
                        : '';

                const card = document.createElement('article');
                card.className = 'figure-card';
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.setAttribute(
                    'aria-label',
                    `${fig.name}, ${stats.timespan}, ${photoCountLabel}`
                );

                card.innerHTML = `
                    <div class="figure-portrait-bevel">
                        <div class="figure-portrait-inner">
                            <div class="aero-specular-glare"></div>
                            <span class="figure-count-badge">
                                <i class='bx bx-layer'></i> ${escapeHtml(photoCountLabel)}
                            </span>
                            <img
                                src="${escapeHtml(fig.portrait)}"
                                alt="Portrait of ${escapeHtml(fig.name)}"
                                class="figure-portrait-img"
                                loading="lazy"
                            >
                            <div class="figure-portrait-anchor">
                                <span class="figure-timespan-pill">
                                    <i class='bx bx-calendar'></i> ${escapeHtml(stats.timespan)}
                                </span>
                                <h3 class="figure-card-name">${escapeHtml(fig.name)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="figure-card-body">
                        ${lifespanText ? `<div class="figure-lifespan"><i class='bx bx-user-pin'></i> <span>${escapeHtml(lifespanText)}</span></div>` : ''}
                        <p class="figure-era-context">${escapeHtml(fig.era_context)}</p>
                        <div class="figure-card-footer">
                            <span>Open Dossier Timeline</span>
                            <span class="figure-card-cta">Explore <i class='bx bx-right-arrow-alt'></i></span>
                        </div>
                    </div>
                `;

                const imgEl = card.querySelector('.figure-portrait-img');
                attachImageFallback(imgEl, {
                    mirrorKey: fig.id,
                    title: fig.name,
                    subtitle: fig.era_context,
                    year: stats.timespan,
                    catalogId: fig.id.toUpperCase(),
                    isPortrait: true
                });

                const openFigureHandler = () => navigateToFigure(fig.id);
                card.addEventListener('click', openFigureHandler);
                card.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openFigureHandler();
                    }
                });

                dom.figuresGrid.appendChild(card);
            });
        }

        // If user entered a search query, also show matching individual photos below
        if (query && matchingPhotos.length > 0) {
            dom.searchPlatesSection.classList.remove('is-hidden');
            dom.searchPlatesCaption.textContent = `${matchingPhotos.length} matching photo${matchingPhotos.length === 1 ? '' : 's'}`;
            dom.searchPlatesGrid.innerHTML = '';

            const sortedMatches = [...matchingPhotos].sort((a, b) => a.year - b.year);
            sortedMatches.forEach((photo, idx) => {
                const plateCard = createPhotoPlateCard(photo, sortedMatches, idx, null);
                dom.searchPlatesGrid.appendChild(plateCard);
            });
        } else {
            dom.searchPlatesSection.classList.add('is-hidden');
            dom.searchPlatesGrid.innerHTML = '';
        }
    }

    /**
     * Creates a single responsive Photo Card element for Timeline or Search Grids
     */
    function createPhotoPlateCard(photo, queueList, indexInQueue, activeFigureId) {
        const card = document.createElement('article');
        card.className = 'photo-plate-card';
        card.tabIndex = 0;
        const title = getPhotoTitle(photo);
        const displayDate = photo.precise_date || String(photo.year || 'Undated');

        card.setAttribute('aria-label', `${title}, ${displayDate}`);

        const tagsHtml = (photo.tags || [])
            .map(tagId => {
                const fig = state.figureById.get(tagId);
                const label = fig ? fig.name : tagId;
                const isCurrent = tagId === activeFigureId;
                return `
                    <button
                        type="button"
                        class="figure-tag-chip ${isCurrent ? 'is-current-figure' : ''}"
                        data-figure-id="${escapeHtml(tagId)}"
                        title="View ${escapeHtml(label)}'s timeline"
                    >
                        <i class='bx bxs-user-badge'></i>
                        <span>${escapeHtml(label)}</span>
                    </button>
                `;
            })
            .join('');

        card.innerHTML = `
            <div class="photo-thumb-frame">
                <div class="photo-thumb-inner">
                    <div class="aero-specular-glare"></div>
                    <img
                        src="${escapeHtml(photo.thumb_url || photo.url)}"
                        alt="${escapeHtml(photo.description || title)}"
                        class="photo-thumb-img"
                        loading="lazy"
                    >
                    <span class="photo-zoom-hint">
                        <i class='bx bx-expand-alt'></i> View Photo
                    </span>
                </div>
            </div>
            <div class="photo-plate-body">
                <div class="photo-plate-meta-top">
                    <span>${escapeHtml(displayDate)}</span>
                    <span class="photo-plate-location">
                        <i class='bx bxs-map'></i> ${escapeHtml(photo.location || 'Archive')}
                    </span>
                </div>
                <h4 class="photo-plate-title">${escapeHtml(title)}</h4>
                <p class="photo-plate-desc">${escapeHtml(photo.description || '')}</p>
                <div class="photo-plate-tags">${tagsHtml}</div>
            </div>
        `;

        const thumbImg = card.querySelector('.photo-thumb-img');
        attachImageFallback(thumbImg, {
            mirrorKey: photo.id,
            title: title,
            subtitle: photo.location || photo.source,
            year: photo.year,
            catalogId: photo.id
        });

        // Tag chip clicks navigate directly to that figure's timeline without opening lightbox
        card.querySelectorAll('.figure-tag-chip').forEach(chip => {
            chip.addEventListener('click', e => {
                e.stopPropagation();
                const targetFigId = chip.getAttribute('data-figure-id');
                if (targetFigId) {
                    navigateToFigure(targetFigId);
                }
            });
        });

        const openModalHandler = () => openLightbox(queueList, indexInQueue);
        card.addEventListener('click', openModalHandler);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModalHandler();
            }
        });

        return card;
    }

    /**
     * Renders View 2: Figure Chronological Timeline View
     */
    function renderTimelineView(figureId) {
        const figure = state.figureById.get(figureId);
        if (!figure) {
            navigateToDirectory();
            return;
        }

        const stats = state.figureStatsMap.get(figureId) || {
            photos: [],
            count: 0,
            timespan: 'Archival'
        };

        // Populate Header Pane
        dom.timelineFigureName.textContent = figure.name;
        if (dom.timelineFigureLifespan) {
            if (figure.birth_date && figure.death_date) {
                dom.timelineFigureLifespan.innerHTML = `<i class='bx bx-user-pin'></i> <span>Born: ${escapeHtml(figure.birth_date)} &middot; Died: ${escapeHtml(figure.death_date)}</span>`;
                dom.timelineFigureLifespan.style.display = 'inline-flex';
            } else if (figure.birth_date) {
                dom.timelineFigureLifespan.innerHTML = `<i class='bx bx-user-pin'></i> <span>Born: ${escapeHtml(figure.birth_date)}</span>`;
                dom.timelineFigureLifespan.style.display = 'inline-flex';
            } else {
                dom.timelineFigureLifespan.innerHTML = '';
                dom.timelineFigureLifespan.style.display = 'none';
            }
        }
        dom.timelineFigureEra.textContent = figure.era_context;
        dom.timelineBadgeSpan.innerHTML = `<i class='bx bx-calendar'></i> ${escapeHtml(stats.timespan)}`;
        const countText =
            stats.count === 1 ? '1 photo' : `${stats.count} photos`;
        dom.timelineBadgeCount.innerHTML = `<i class='bx bx-layer'></i> ${escapeHtml(countText)}`;

        // Portrait with fallback
        delete dom.timelinePortraitImg.dataset.fallbackApplied;
        dom.timelinePortraitImg.src = figure.portrait;
        dom.timelinePortraitImg.alt = `Portrait of ${figure.name}`;
        attachImageFallback(dom.timelinePortraitImg, {
            mirrorKey: figure.id,
            title: figure.name,
            subtitle: figure.era_context,
            year: stats.timespan,
            catalogId: figure.id.toUpperCase(),
            isPortrait: true
        });

        // Compute co-tagged figures across this figure's photos
        const coTaggedCounts = new Map();
        stats.photos.forEach(p => {
            (p.tags || []).forEach(tid => {
                if (tid !== figureId) {
                    coTaggedCounts.set(tid, (coTaggedCounts.get(tid) || 0) + 1);
                }
            });
        });

        dom.timelineCotaggedRow.innerHTML = '';
        if (coTaggedCounts.size > 0) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'timeline-cotagged-label';
            labelSpan.textContent = 'Cross-Indexed With:';
            dom.timelineCotaggedRow.appendChild(labelSpan);

            coTaggedCounts.forEach((sharedCount, coFigId) => {
                const coFig = state.figureById.get(coFigId);
                if (!coFig) return;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'figure-tag-chip';
                chip.innerHTML = `
                    <i class='bx bx-link-alt'></i>
                    <span>${escapeHtml(coFig.name)} (${sharedCount})</span>
                `;
                chip.addEventListener('click', () => navigateToFigure(coFigId));
                dom.timelineCotaggedRow.appendChild(chip);
            });
        }

        // Sort photos chronologically (ascending or descending)
        const sortedPhotos = [...stats.photos].sort((a, b) => {
            const diff = (Number(a.year) || 0) - (Number(b.year) || 0);
            if (diff !== 0) {
                return state.timelineSortOrder === 'asc' ? diff : -diff;
            }
            return String(a.id).localeCompare(String(b.id));
        });

        // Update Sort Buttons UI
        dom.btnSortAsc.classList.toggle('is-active', state.timelineSortOrder === 'asc');
        dom.btnSortDesc.classList.toggle('is-active', state.timelineSortOrder === 'desc');

        // Group photos by Year preserving sort order
        const yearGroups = new Map();
        sortedPhotos.forEach((photo, flatIndex) => {
            const yearKey = photo.year ? String(photo.year) : 'Undated';
            if (!yearGroups.has(yearKey)) {
                yearGroups.set(yearKey, []);
            }
            yearGroups.get(yearKey).push({ photo, flatIndex });
        });

        // Render Year Jump Pills
        dom.timelineYearJumps.innerHTML = '<span class="year-jump-label">Jump to Year:</span>';
        yearGroups.forEach((_, yearKey) => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'year-jump-pill';
            pill.textContent = yearKey;
            pill.addEventListener('click', () => {
                const targetSection = document.getElementById(`archive-year-${yearKey}`);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            dom.timelineYearJumps.appendChild(pill);
        });

        // Render Chronological Year Sections
        dom.timelineYearsContainer.innerHTML = '';
        if (sortedPhotos.length === 0) {
            dom.timelineYearsContainer.innerHTML = `
                <div class="archive-empty-state">
                    <i class='bx bx-folder-open'></i>
                    <h3>No Photos Indexed Yet</h3>
                    <p>This dossier currently contains no digitized photos.</p>
                </div>
            `;
            return;
        }

        yearGroups.forEach((items, yearKey) => {
            const section = document.createElement('section');
            section.className = 'timeline-year-section';
            section.id = `archive-year-${yearKey}`;

            const photoCountText =
                items.length === 1 ? '1 photo' : `${items.length} photos`;

            section.innerHTML = `
                <div class="timeline-year-header">
                    <span class="timeline-year-badge">${escapeHtml(yearKey)}</span>
                    <div class="timeline-year-line"></div>
                    <span class="timeline-year-count">${escapeHtml(photoCountText)}</span>
                </div>
                <div class="timeline-photos-grid"></div>
            `;

            const grid = section.querySelector('.timeline-photos-grid');
            items.forEach(({ photo, flatIndex }) => {
                const card = createPhotoPlateCard(
                    photo,
                    sortedPhotos,
                    flatIndex,
                    figureId
                );
                grid.appendChild(card);
            });

            dom.timelineYearsContainer.appendChild(section);
        });
    }

    /**
     * Smoothly transitions between Index Directory and Figure Timeline views
     */
    function switchView(targetView, figureId = null, pushUrlHash = true) {
        const currentEl =
            state.activeView === 'directory' ? dom.viewDirectory : dom.viewTimeline;
        const nextEl =
            targetView === 'directory' ? dom.viewDirectory : dom.viewTimeline;

        state.activeView = targetView;
        state.activeFigureId = figureId;

        if (pushUrlHash) {
            const newHash =
                targetView === 'timeline' && figureId ? `#figure=${encodeURIComponent(figureId)}` : '';
            if (window.location.hash !== newHash) {
                if (newHash) {
                    history.pushState(null, '', newHash);
                } else {
                    history.pushState(null, '', window.location.pathname + window.location.search);
                }
            }
        }

        currentEl.classList.add('is-transitioning');

        setTimeout(() => {
            currentEl.classList.add('is-hidden');
            currentEl.classList.remove('is-transitioning');

            if (targetView === 'timeline' && figureId) {
                renderTimelineView(figureId);
            } else {
                renderDirectoryView();
            }

            nextEl.classList.remove('is-hidden');
            nextEl.classList.add('is-transitioning');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    nextEl.classList.remove('is-transitioning');
                });
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 180);
    }

    function navigateToFigure(figureId, pushUrlHash = true) {
        if (!state.figureById.has(figureId)) return;
        if (!dom.lightbox.classList.contains('is-hidden')) {
            closeLightbox();
        }
        if (state.activeView === 'timeline' && state.activeFigureId === figureId) {
            renderTimelineView(figureId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        switchView('timeline', figureId, pushUrlHash);
    }

    function navigateToDirectory(pushUrlHash = true) {
        if (!dom.lightbox.classList.contains('is-hidden')) {
            closeLightbox();
        }
        if (state.activeView === 'directory') {
            renderDirectoryView();
            return;
        }
        switchView('directory', null, pushUrlHash);
    }

    /**
     * View 3: Archival Lightbox / Document Viewer
     */
    function openLightbox(queueList, index) {
        if (!Array.isArray(queueList) || index < 0 || index >= queueList.length) return;
        state.lightboxQueue = queueList;
        state.lightboxIndex = index;

        updateLightboxContent();
        dom.lightbox.classList.remove('is-hidden');
        dom.lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        dom.lightbox.classList.add('is-hidden');
        dom.lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    function stepLightbox(delta) {
        if (!state.lightboxQueue.length) return;
        const nextIndex = state.lightboxIndex + delta;
        if (nextIndex < 0 || nextIndex >= state.lightboxQueue.length) return;
        state.lightboxIndex = nextIndex;
        updateLightboxContent();
    }

    function updateLightboxContent() {
        const photo = state.lightboxQueue[state.lightboxIndex];
        if (!photo) return;

        const total = state.lightboxQueue.length;
        const currentNum = state.lightboxIndex + 1;
        const title = getPhotoTitle(photo);
        const displayDate = photo.precise_date && photo.precise_date.trim()
            ? photo.precise_date.trim()
            : String(photo.year || 'Undated');

        dom.lightboxCounter.textContent = `Photo ${currentNum} of ${total}`;
        dom.lightboxPrevBtn.disabled = state.lightboxIndex <= 0;
        dom.lightboxNextBtn.disabled = state.lightboxIndex >= total - 1;

        // High-res image + resilient fallback
        delete dom.lightboxImg.dataset.fallbackApplied;
        dom.lightboxImg.src = photo.url || photo.thumb_url;
        dom.lightboxImg.alt = photo.description || title;
        attachImageFallback(dom.lightboxImg, {
            mirrorKey: photo.id,
            title: title,
            subtitle: `${displayDate} — ${photo.location || ''}`,
            year: photo.year,
            catalogId: photo.id
        });

        // Dossier Metadata
        dom.dossierCatalogId.textContent = `PHOTO // ${photo.id}`;
        dom.dossierTitle.textContent = title;
        dom.dossierDate.textContent = displayDate;
        dom.dossierLocation.textContent = photo.location || 'Location Unspecified';
        const sourceLabel = photo.source || 'SosaSpeaks Historical Repository';
        if (photo.source_url && photo.source_url.trim()) {
            dom.dossierSource.innerHTML = `<a href="${escapeHtml(photo.source_url.trim())}" target="_blank" rel="noopener noreferrer" class="dossier-source-link">${escapeHtml(sourceLabel)} <i class='bx bx-link-external'></i></a>`;
        } else {
            dom.dossierSource.textContent = sourceLabel;
        }
        dom.dossierDescription.textContent = photo.description || '';

        // Interactive Tagged Figures Pills
        dom.dossierTagsList.innerHTML = '';
        (photo.tags || []).forEach(tagId => {
            const fig = state.figureById.get(tagId);
            const figName = fig ? fig.name : tagId;
            const isCurrentTimeline = tagId === state.activeFigureId;

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `dossier-figure-pill ${isCurrentTimeline ? 'is-active-timeline' : ''}`;
            pill.title = isCurrentTimeline
                ? `Currently viewing ${figName}'s timeline`
                : `Switch to ${figName}'s chronological timeline`;

            pill.innerHTML = `
                <i class='bx ${isCurrentTimeline ? 'bxs-check-circle' : 'bxs-user-detail'}'></i>
                <span>${escapeHtml(figName)}</span>
                ${!isCurrentTimeline ? "<i class='bx bx-right-arrow-alt'></i>" : ''}
            `;

            pill.addEventListener('click', () => {
                closeLightbox();
                navigateToFigure(tagId);
            });

            dom.dossierTagsList.appendChild(pill);
        });
    }

    /**
     * Wire up DOM Event Listeners (Search, Sort, Keyboard Navigation, History Popstate)
     */
    function bindEvents() {
        // Global Search Bar
        if (dom.searchInput) {
            dom.searchInput.addEventListener('input', e => {
                state.searchQuery = e.target.value;
                dom.searchClearBtn.classList.toggle('is-hidden', !state.searchQuery);
                renderDirectoryView();
            });
        }

        if (dom.searchClearBtn) {
            dom.searchClearBtn.addEventListener('click', () => {
                state.searchQuery = '';
                dom.searchInput.value = '';
                dom.searchClearBtn.classList.add('is-hidden');
                renderDirectoryView();
                dom.searchInput.focus();
            });
        }

        // Directory Sort Select
        if (dom.directorySortSelect) {
            dom.directorySortSelect.addEventListener('change', e => {
                state.directorySortBy = e.target.value;
                renderDirectoryView();
            });
        }

        // Timeline Breadcrumb Back Button
        if (dom.btnBackDirectory) {
            dom.btnBackDirectory.addEventListener('click', () => navigateToDirectory());
        }

        // Timeline Chronological Sort Toggle (Ascending / Descending)
        if (dom.btnSortAsc) {
            dom.btnSortAsc.addEventListener('click', () => {
                if (state.timelineSortOrder !== 'asc') {
                    state.timelineSortOrder = 'asc';
                    renderTimelineView(state.activeFigureId);
                }
            });
        }

        if (dom.btnSortDesc) {
            dom.btnSortDesc.addEventListener('click', () => {
                if (state.timelineSortOrder !== 'desc') {
                    state.timelineSortOrder = 'desc';
                    renderTimelineView(state.activeFigureId);
                }
            });
        }

        // Lightbox Controls
        if (dom.lightboxCloseBtn) {
            dom.lightboxCloseBtn.addEventListener('click', closeLightbox);
        }

        if (dom.lightboxPrevBtn) {
            dom.lightboxPrevBtn.addEventListener('click', e => {
                e.stopPropagation();
                stepLightbox(-1);
            });
        }

        if (dom.lightboxNextBtn) {
            dom.lightboxNextBtn.addEventListener('click', e => {
                e.stopPropagation();
                stepLightbox(1);
            });
        }

        // Dismiss Lightbox on Backdrop Click
        if (dom.lightbox) {
            dom.lightbox.addEventListener('click', e => {
                if (e.target === dom.lightbox) {
                    closeLightbox();
                }
            });
        }

        // Fullscreen Canvas Toggle
        if (dom.lightboxFullscreenBtn) {
            dom.lightboxFullscreenBtn.addEventListener('click', () => {
                const canvasPane = dom.lightbox.querySelector('.lightbox-window');
                if (!document.fullscreenElement && canvasPane?.requestFullscreen) {
                    canvasPane.requestFullscreen().catch(() => {});
                } else if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Keyboard Navigation: Escape to close Lightbox, Left/Right Arrows to cycle photos
        window.addEventListener('keydown', e => {
            const isLightboxOpen = !dom.lightbox.classList.contains('is-hidden');
            if (!isLightboxOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                stepLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                stepLightbox(1);
            }
        });

        // Browser Back / Forward URL Hash synchronization
        window.addEventListener('popstate', () => {
            applyRouteFromHash(false);
        });
    }

    /**
     * Reads `#figure=<id>` from `window.location.hash` to support direct deep-linking
     */
    function applyRouteFromHash(animate = false) {
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const figId = params.get('figure');

        if (figId && state.figureById.has(figId)) {
            if (animate) {
                navigateToFigure(figId, false);
            } else {
                state.activeView = 'timeline';
                state.activeFigureId = figId;
                dom.viewDirectory.classList.add('is-hidden');
                dom.viewTimeline.classList.remove('is-hidden');
                renderTimelineView(figId);
            }
        } else {
            if (animate) {
                navigateToDirectory(false);
            } else {
                state.activeView = 'directory';
                state.activeFigureId = null;
                dom.viewTimeline.classList.add('is-hidden');
                dom.viewDirectory.classList.remove('is-hidden');
                renderDirectoryView();
            }
        }
    }

    /**
     * Checks for ?admin=true query trigger or active admin session and injects
     * a quick-launch link to archive-admin.html in the toolbar.
     */
    function checkAdminShortcut() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            sessionStorage.setItem('sosaspins_admin_auth', 'true');
        }
        if (sessionStorage.getItem('sosaspins_admin_auth') === 'true') {
            const metaBar = document.querySelector('.archive-toolbar-meta');
            if (metaBar && !document.getElementById('archive-admin-shortcut')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'archive-admin-shortcut';
                adminLink.href = 'archive-admin.html';
                adminLink.className = 'archive-stat-pill';
                adminLink.style.cssText = 'color: #10b981; border-color: rgba(16, 185, 129, 0.45); font-weight: 700; text-decoration: none;';
                adminLink.title = 'Open Visual Archive Admin Portal';
                adminLink.innerHTML = `<i class='bx bx-slider-alt'></i><span>Admin Portal</span>`;
                metaBar.appendChild(adminLink);
            }
        }
    }

    /**
     * Initialize The Sosa Archive
     */
    async function initArchive() {
        cacheDom();
        checkAdminShortcut();
        const manifest = await loadManifest();
        indexArchiveData(manifest);
        renderGlobalStats();
        bindEvents();
        applyRouteFromHash(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArchive);
    } else {
        initArchive();
    }
})();

