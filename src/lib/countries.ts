import { Language } from './translations';

export interface CountryData {
  code: string;
  flagUrl: string;
  names: {
    es: string;
    en: string;
    it: string;
  };
}

export const COUNTRIES: CountryData[] = [
  { code: 'af', flagUrl: 'https://flagcdn.com/w160/af.png', names: { es: 'Afganistan', en: 'Afghanistan', it: 'Afghanistan' } },
  { code: 'al', flagUrl: 'https://flagcdn.com/w160/al.png', names: { es: 'Albania', en: 'Albania', it: 'Albania' } },
  { code: 'de', flagUrl: 'https://flagcdn.com/w160/de.png', names: { es: 'Alemania', en: 'Germany', it: 'Germania' } },
  { code: 'ad', flagUrl: 'https://flagcdn.com/w160/ad.png', names: { es: 'Andorra', en: 'Andorra', it: 'Andorra' } },
  { code: 'ao', flagUrl: 'https://flagcdn.com/w160/ao.png', names: { es: 'Angola', en: 'Angola', it: 'Angola' } },
  { code: 'ag', flagUrl: 'https://flagcdn.com/w160/ag.png', names: { es: 'Antigua y Barbuda', en: 'Antigua and Barbuda', it: 'Antigua e Barbuda' } },
  { code: 'sa', flagUrl: 'https://flagcdn.com/w160/sa.png', names: { es: 'Arabia Saudita', en: 'Saudi Arabia', it: 'Arabia Saudita' } },
  { code: 'dz', flagUrl: 'https://flagcdn.com/w160/dz.png', names: { es: 'Argelia', en: 'Algeria', it: 'Algeria' } },
  { code: 'ar', flagUrl: 'https://flagcdn.com/w160/ar.png', names: { es: 'Argentina', en: 'Argentina', it: 'Argentina' } },
  { code: 'am', flagUrl: 'https://flagcdn.com/w160/am.png', names: { es: 'Armenia', en: 'Armenia', it: 'Armenia' } },
  { code: 'au', flagUrl: 'https://flagcdn.com/w160/au.png', names: { es: 'Australia', en: 'Australia', it: 'Australia' } },
  { code: 'at', flagUrl: 'https://flagcdn.com/w160/at.png', names: { es: 'Austria', en: 'Austria', it: 'Austria' } },
  { code: 'az', flagUrl: 'https://flagcdn.com/w160/az.png', names: { es: 'Azerbaiyan', en: 'Azerbaijan', it: 'Azerbaigian' } },
  { code: 'bs', flagUrl: 'https://flagcdn.com/w160/bs.png', names: { es: 'Bahamas', en: 'Bahamas', it: 'Bahamas' } },
  { code: 'bd', flagUrl: 'https://flagcdn.com/w160/bd.png', names: { es: 'Bangladesh', en: 'Bangladesh', it: 'Bangladesh' } },
  { code: 'bb', flagUrl: 'https://flagcdn.com/w160/bb.png', names: { es: 'Barbados', en: 'Barbados', it: 'Barbados' } },
  { code: 'bh', flagUrl: 'https://flagcdn.com/w160/bh.png', names: { es: 'Barein', en: 'Bahrain', it: 'Bahrein' } },
  { code: 'be', flagUrl: 'https://flagcdn.com/w160/be.png', names: { es: 'Belgica', en: 'Belgium', it: 'Belgio' } },
  { code: 'bz', flagUrl: 'https://flagcdn.com/w160/bz.png', names: { es: 'Belice', en: 'Belize', it: 'Belize' } },
  { code: 'bj', flagUrl: 'https://flagcdn.com/w160/bj.png', names: { es: 'Benin', en: 'Benin', it: 'Benin' } },
  { code: 'by', flagUrl: 'https://flagcdn.com/w160/by.png', names: { es: 'Bielorrusia', en: 'Belarus', it: 'Bielorussia' } },
  { code: 'mm', flagUrl: 'https://flagcdn.com/w160/mm.png', names: { es: 'Birmania', en: 'Myanmar', it: 'Myanmar' } },
  { code: 'bo', flagUrl: 'https://flagcdn.com/w160/bo.png', names: { es: 'Bolivia', en: 'Bolivia', it: 'Bolivia' } },
  { code: 'ba', flagUrl: 'https://flagcdn.com/w160/ba.png', names: { es: 'Bosnia y Herzegovina', en: 'Bosnia and Herzegovina', it: 'Bosnia ed Erzegovina' } },
  { code: 'bw', flagUrl: 'https://flagcdn.com/w160/bw.png', names: { es: 'Botsuana', en: 'Botswana', it: 'Botswana' } },
  { code: 'br', flagUrl: 'https://flagcdn.com/w160/br.png', names: { es: 'Brasil', en: 'Brazil', it: 'Brasile' } },
  { code: 'bn', flagUrl: 'https://flagcdn.com/w160/bn.png', names: { es: 'Brunei', en: 'Brunei', it: 'Brunei' } },
  { code: 'bg', flagUrl: 'https://flagcdn.com/w160/bg.png', names: { es: 'Bulgaria', en: 'Bulgaria', it: 'Bulgaria' } },
  { code: 'bf', flagUrl: 'https://flagcdn.com/w160/bf.png', names: { es: 'Burkina Faso', en: 'Burkina Faso', it: 'Burkina Faso' } },
  { code: 'bi', flagUrl: 'https://flagcdn.com/w160/bi.png', names: { es: 'Burundi', en: 'Burundi', it: 'Burundi' } },
  { code: 'bt', flagUrl: 'https://flagcdn.com/w160/bt.png', names: { es: 'Butan', en: 'Bhutan', it: 'Bhutan' } },
  { code: 'cv', flagUrl: 'https://flagcdn.com/w160/cv.png', names: { es: 'Cabo Verde', en: 'Cape Verde', it: 'Capo Verde' } },
  { code: 'kh', flagUrl: 'https://flagcdn.com/w160/kh.png', names: { es: 'Camboya', en: 'Cambodia', it: 'Cambogia' } },
  { code: 'cm', flagUrl: 'https://flagcdn.com/w160/cm.png', names: { es: 'Camerun', en: 'Cameroon', it: 'Camerun' } },
  { code: 'ca', flagUrl: 'https://flagcdn.com/w160/ca.png', names: { es: 'Canada', en: 'Canada', it: 'Canada' } },
  { code: 'qa', flagUrl: 'https://flagcdn.com/w160/qa.png', names: { es: 'Catar', en: 'Qatar', it: 'Qatar' } },
  { code: 'td', flagUrl: 'https://flagcdn.com/w160/td.png', names: { es: 'Chad', en: 'Chad', it: 'Ciad' } },
  { code: 'cl', flagUrl: 'https://flagcdn.com/w160/cl.png', names: { es: 'Chile', en: 'Chile', it: 'Cile' } },
  { code: 'cn', flagUrl: 'https://flagcdn.com/w160/cn.png', names: { es: 'China', en: 'China', it: 'Cina' } },
  { code: 'cy', flagUrl: 'https://flagcdn.com/w160/cy.png', names: { es: 'Chipre', en: 'Cyprus', it: 'Cipro' } },
  { code: 'co', flagUrl: 'https://flagcdn.com/w160/co.png', names: { es: 'Colombia', en: 'Colombia', it: 'Colombia' } },
  { code: 'km', flagUrl: 'https://flagcdn.com/w160/km.png', names: { es: 'Comoras', en: 'Comoros', it: 'Comore' } },
  { code: 'kp', flagUrl: 'https://flagcdn.com/w160/kp.png', names: { es: 'Corea del Norte', en: 'North Korea', it: 'Corea del Nord' } },
  { code: 'kr', flagUrl: 'https://flagcdn.com/w160/kr.png', names: { es: 'Corea del Sur', en: 'South Korea', it: 'Corea del Sud' } },
  { code: 'ci', flagUrl: 'https://flagcdn.com/w160/ci.png', names: { es: 'Costa de Marfil', en: 'Ivory Coast', it: "Costa d'Avorio" } },
  { code: 'cr', flagUrl: 'https://flagcdn.com/w160/cr.png', names: { es: 'Costa Rica', en: 'Costa Rica', it: 'Costa Rica' } },
  { code: 'hr', flagUrl: 'https://flagcdn.com/w160/hr.png', names: { es: 'Croacia', en: 'Croatia', it: 'Croazia' } },
  { code: 'cu', flagUrl: 'https://flagcdn.com/w160/cu.png', names: { es: 'Cuba', en: 'Cuba', it: 'Cuba' } },
  { code: 'dk', flagUrl: 'https://flagcdn.com/w160/dk.png', names: { es: 'Dinamarca', en: 'Denmark', it: 'Danimarca' } },
  { code: 'dm', flagUrl: 'https://flagcdn.com/w160/dm.png', names: { es: 'Dominica', en: 'Dominica', it: 'Dominica' } },
  { code: 'ec', flagUrl: 'https://flagcdn.com/w160/ec.png', names: { es: 'Ecuador', en: 'Ecuador', it: 'Ecuador' } },
  { code: 'eg', flagUrl: 'https://flagcdn.com/w160/eg.png', names: { es: 'Egipto', en: 'Egypt', it: 'Egitto' } },
  { code: 'sv', flagUrl: 'https://flagcdn.com/w160/sv.png', names: { es: 'El Salvador', en: 'El Salvador', it: 'El Salvador' } },
  { code: 'ae', flagUrl: 'https://flagcdn.com/w160/ae.png', names: { es: 'Emiratos Arabes Unidos', en: 'United Arab Emirates', it: 'Emirati Arabi Uniti' } },
  { code: 'er', flagUrl: 'https://flagcdn.com/w160/er.png', names: { es: 'Eritrea', en: 'Eritrea', it: 'Eritrea' } },
  { code: 'sk', flagUrl: 'https://flagcdn.com/w160/sk.png', names: { es: 'Eslovaquia', en: 'Slovakia', it: 'Slovacchia' } },
  { code: 'si', flagUrl: 'https://flagcdn.com/w160/si.png', names: { es: 'Eslovenia', en: 'Slovenia', it: 'Slovenia' } },
  { code: 'es', flagUrl: 'https://flagcdn.com/w160/es.png', names: { es: 'Espana', en: 'Spain', it: 'Spagna' } },
  { code: 'us', flagUrl: 'https://flagcdn.com/w160/us.png', names: { es: 'Estados Unidos', en: 'United States', it: 'Stati Uniti' } },
  { code: 'ee', flagUrl: 'https://flagcdn.com/w160/ee.png', names: { es: 'Estonia', en: 'Estonia', it: 'Estonia' } },
  { code: 'et', flagUrl: 'https://flagcdn.com/w160/et.png', names: { es: 'Etiopia', en: 'Ethiopia', it: 'Etiopia' } },
  { code: 'ph', flagUrl: 'https://flagcdn.com/w160/ph.png', names: { es: 'Filipinas', en: 'Philippines', it: 'Filippine' } },
  { code: 'fi', flagUrl: 'https://flagcdn.com/w160/fi.png', names: { es: 'Finlandia', en: 'Finland', it: 'Finlandia' } },
  { code: 'fj', flagUrl: 'https://flagcdn.com/w160/fj.png', names: { es: 'Fiyi', en: 'Fiji', it: 'Figi' } },
  { code: 'fr', flagUrl: 'https://flagcdn.com/w160/fr.png', names: { es: 'Francia', en: 'France', it: 'Francia' } },
  { code: 'ga', flagUrl: 'https://flagcdn.com/w160/ga.png', names: { es: 'Gabon', en: 'Gabon', it: 'Gabon' } },
  { code: 'gm', flagUrl: 'https://flagcdn.com/w160/gm.png', names: { es: 'Gambia', en: 'Gambia', it: 'Gambia' } },
  { code: 'ge', flagUrl: 'https://flagcdn.com/w160/ge.png', names: { es: 'Georgia', en: 'Georgia', it: 'Georgia' } },
  { code: 'gh', flagUrl: 'https://flagcdn.com/w160/gh.png', names: { es: 'Ghana', en: 'Ghana', it: 'Ghana' } },
  { code: 'gd', flagUrl: 'https://flagcdn.com/w160/gd.png', names: { es: 'Granada', en: 'Grenada', it: 'Grenada' } },
  { code: 'gr', flagUrl: 'https://flagcdn.com/w160/gr.png', names: { es: 'Grecia', en: 'Greece', it: 'Grecia' } },
  { code: 'gt', flagUrl: 'https://flagcdn.com/w160/gt.png', names: { es: 'Guatemala', en: 'Guatemala', it: 'Guatemala' } },
  { code: 'gn', flagUrl: 'https://flagcdn.com/w160/gn.png', names: { es: 'Guinea', en: 'Guinea', it: 'Guinea' } },
  { code: 'gq', flagUrl: 'https://flagcdn.com/w160/gq.png', names: { es: 'Guinea Ecuatorial', en: 'Equatorial Guinea', it: 'Guinea Equatoriale' } },
  { code: 'gw', flagUrl: 'https://flagcdn.com/w160/gw.png', names: { es: 'Guinea-Bisau', en: 'Guinea-Bissau', it: 'Guinea-Bissau' } },
  { code: 'gy', flagUrl: 'https://flagcdn.com/w160/gy.png', names: { es: 'Guyana', en: 'Guyana', it: 'Guyana' } },
  { code: 'ht', flagUrl: 'https://flagcdn.com/w160/ht.png', names: { es: 'Haiti', en: 'Haiti', it: 'Haiti' } },
  { code: 'hn', flagUrl: 'https://flagcdn.com/w160/hn.png', names: { es: 'Honduras', en: 'Honduras', it: 'Honduras' } },
  { code: 'hu', flagUrl: 'https://flagcdn.com/w160/hu.png', names: { es: 'Hungria', en: 'Hungary', it: 'Ungheria' } },
  { code: 'in', flagUrl: 'https://flagcdn.com/w160/in.png', names: { es: 'India', en: 'India', it: 'India' } },
  { code: 'id', flagUrl: 'https://flagcdn.com/w160/id.png', names: { es: 'Indonesia', en: 'Indonesia', it: 'Indonesia' } },
  { code: 'iq', flagUrl: 'https://flagcdn.com/w160/iq.png', names: { es: 'Irak', en: 'Iraq', it: 'Iraq' } },
  { code: 'ir', flagUrl: 'https://flagcdn.com/w160/ir.png', names: { es: 'Iran', en: 'Iran', it: 'Iran' } },
  { code: 'ie', flagUrl: 'https://flagcdn.com/w160/ie.png', names: { es: 'Irlanda', en: 'Ireland', it: 'Irlanda' } },
  { code: 'is', flagUrl: 'https://flagcdn.com/w160/is.png', names: { es: 'Islandia', en: 'Iceland', it: 'Islanda' } },
  { code: 'mh', flagUrl: 'https://flagcdn.com/w160/mh.png', names: { es: 'Islas Marshall', en: 'Marshall Islands', it: 'Isole Marshall' } },
  { code: 'sb', flagUrl: 'https://flagcdn.com/w160/sb.png', names: { es: 'Islas Salomon', en: 'Solomon Islands', it: 'Isole Salomone' } },
  { code: 'il', flagUrl: 'https://flagcdn.com/w160/il.png', names: { es: 'Israel', en: 'Israel', it: 'Israele' } },
  { code: 'it', flagUrl: 'https://flagcdn.com/w160/it.png', names: { es: 'Italia', en: 'Italy', it: 'Italia' } },
  { code: 'jm', flagUrl: 'https://flagcdn.com/w160/jm.png', names: { es: 'Jamaica', en: 'Jamaica', it: 'Giamaica' } },
  { code: 'jp', flagUrl: 'https://flagcdn.com/w160/jp.png', names: { es: 'Japon', en: 'Japan', it: 'Giappone' } },
  { code: 'jo', flagUrl: 'https://flagcdn.com/w160/jo.png', names: { es: 'Jordania', en: 'Jordan', it: 'Giordania' } },
  { code: 'kz', flagUrl: 'https://flagcdn.com/w160/kz.png', names: { es: 'Kazajistan', en: 'Kazakhstan', it: 'Kazakistan' } },
  { code: 'ke', flagUrl: 'https://flagcdn.com/w160/ke.png', names: { es: 'Kenia', en: 'Kenya', it: 'Kenya' } },
  { code: 'kg', flagUrl: 'https://flagcdn.com/w160/kg.png', names: { es: 'Kirguistan', en: 'Kyrgyzstan', it: 'Kirghizistan' } },
  { code: 'ki', flagUrl: 'https://flagcdn.com/w160/ki.png', names: { es: 'Kiribati', en: 'Kiribati', it: 'Kiribati' } },
  { code: 'kw', flagUrl: 'https://flagcdn.com/w160/kw.png', names: { es: 'Kuwait', en: 'Kuwait', it: 'Kuwait' } },
  { code: 'la', flagUrl: 'https://flagcdn.com/w160/la.png', names: { es: 'Laos', en: 'Laos', it: 'Laos' } },
  { code: 'ls', flagUrl: 'https://flagcdn.com/w160/ls.png', names: { es: 'Lesoto', en: 'Lesotho', it: 'Lesotho' } },
  { code: 'lv', flagUrl: 'https://flagcdn.com/w160/lv.png', names: { es: 'Letonia', en: 'Latvia', it: 'Lettonia' } },
  { code: 'lb', flagUrl: 'https://flagcdn.com/w160/lb.png', names: { es: 'Libano', en: 'Lebanon', it: 'Libano' } },
  { code: 'lr', flagUrl: 'https://flagcdn.com/w160/lr.png', names: { es: 'Liberia', en: 'Liberia', it: 'Liberia' } },
  { code: 'ly', flagUrl: 'https://flagcdn.com/w160/ly.png', names: { es: 'Libia', en: 'Libya', it: 'Libia' } },
  { code: 'li', flagUrl: 'https://flagcdn.com/w160/li.png', names: { es: 'Liechtenstein', en: 'Liechtenstein', it: 'Liechtenstein' } },
  { code: 'lt', flagUrl: 'https://flagcdn.com/w160/lt.png', names: { es: 'Lituania', en: 'Lithuania', it: 'Lituania' } },
  { code: 'lu', flagUrl: 'https://flagcdn.com/w160/lu.png', names: { es: 'Luxemburgo', en: 'Luxembourg', it: 'Lussemburgo' } },
  { code: 'mk', flagUrl: 'https://flagcdn.com/w160/mk.png', names: { es: 'Macedonia del Norte', en: 'North Macedonia', it: 'Macedonia del Nord' } },
  { code: 'mg', flagUrl: 'https://flagcdn.com/w160/mg.png', names: { es: 'Madagascar', en: 'Madagascar', it: 'Madagascar' } },
  { code: 'my', flagUrl: 'https://flagcdn.com/w160/my.png', names: { es: 'Malasia', en: 'Malaysia', it: 'Malesia' } },
  { code: 'mw', flagUrl: 'https://flagcdn.com/w160/mw.png', names: { es: 'Malaui', en: 'Malawi', it: 'Malawi' } },
  { code: 'mv', flagUrl: 'https://flagcdn.com/w160/mv.png', names: { es: 'Maldivas', en: 'Maldives', it: 'Maldive' } },
  { code: 'ml', flagUrl: 'https://flagcdn.com/w160/ml.png', names: { es: 'Mali', en: 'Mali', it: 'Mali' } },
  { code: 'mt', flagUrl: 'https://flagcdn.com/w160/mt.png', names: { es: 'Malta', en: 'Malta', it: 'Malta' } },
  { code: 'ma', flagUrl: 'https://flagcdn.com/w160/ma.png', names: { es: 'Marruecos', en: 'Morocco', it: 'Marocco' } },
  { code: 'mu', flagUrl: 'https://flagcdn.com/w160/mu.png', names: { es: 'Mauricio', en: 'Mauritius', it: 'Mauritius' } },
  { code: 'mr', flagUrl: 'https://flagcdn.com/w160/mr.png', names: { es: 'Mauritania', en: 'Mauritania', it: 'Mauritania' } },
  { code: 'mx', flagUrl: 'https://flagcdn.com/w160/mx.png', names: { es: 'Mexico', en: 'Mexico', it: 'Messico' } },
  { code: 'fm', flagUrl: 'https://flagcdn.com/w160/fm.png', names: { es: 'Micronesia', en: 'Micronesia', it: 'Micronesia' } },
  { code: 'md', flagUrl: 'https://flagcdn.com/w160/md.png', names: { es: 'Moldavia', en: 'Moldova', it: 'Moldavia' } },
  { code: 'mc', flagUrl: 'https://flagcdn.com/w160/mc.png', names: { es: 'Monaco', en: 'Monaco', it: 'Monaco' } },
  { code: 'mn', flagUrl: 'https://flagcdn.com/w160/mn.png', names: { es: 'Mongolia', en: 'Mongolia', it: 'Mongolia' } },
  { code: 'me', flagUrl: 'https://flagcdn.com/w160/me.png', names: { es: 'Montenegro', en: 'Montenegro', it: 'Montenegro' } },
  { code: 'mz', flagUrl: 'https://flagcdn.com/w160/mz.png', names: { es: 'Mozambique', en: 'Mozambique', it: 'Mozambico' } },
  { code: 'na', flagUrl: 'https://flagcdn.com/w160/na.png', names: { es: 'Namibia', en: 'Namibia', it: 'Namibia' } },
  { code: 'nr', flagUrl: 'https://flagcdn.com/w160/nr.png', names: { es: 'Nauru', en: 'Nauru', it: 'Nauru' } },
  { code: 'np', flagUrl: 'https://flagcdn.com/w160/np.png', names: { es: 'Nepal', en: 'Nepal', it: 'Nepal' } },
  { code: 'ni', flagUrl: 'https://flagcdn.com/w160/ni.png', names: { es: 'Nicaragua', en: 'Nicaragua', it: 'Nicaragua' } },
  { code: 'ne', flagUrl: 'https://flagcdn.com/w160/ne.png', names: { es: 'Niger', en: 'Niger', it: 'Niger' } },
  { code: 'ng', flagUrl: 'https://flagcdn.com/w160/ng.png', names: { es: 'Nigeria', en: 'Nigeria', it: 'Nigeria' } },
  { code: 'no', flagUrl: 'https://flagcdn.com/w160/no.png', names: { es: 'Noruega', en: 'Norway', it: 'Norvegia' } },
  { code: 'nz', flagUrl: 'https://flagcdn.com/w160/nz.png', names: { es: 'Nueva Zelanda', en: 'New Zealand', it: 'Nuova Zelanda' } },
  { code: 'om', flagUrl: 'https://flagcdn.com/w160/om.png', names: { es: 'Oman', en: 'Oman', it: 'Oman' } },
  { code: 'nl', flagUrl: 'https://flagcdn.com/w160/nl.png', names: { es: 'Paises Bajos', en: 'Netherlands', it: 'Paesi Bassi' } },
  { code: 'pk', flagUrl: 'https://flagcdn.com/w160/pk.png', names: { es: 'Pakistan', en: 'Pakistan', it: 'Pakistan' } },
  { code: 'pw', flagUrl: 'https://flagcdn.com/w160/pw.png', names: { es: 'Palaos', en: 'Palau', it: 'Palau' } },
  { code: 'pa', flagUrl: 'https://flagcdn.com/w160/pa.png', names: { es: 'Panama', en: 'Panama', it: 'Panama' } },
  { code: 'pg', flagUrl: 'https://flagcdn.com/w160/pg.png', names: { es: 'Papua Nueva Guinea', en: 'Papua New Guinea', it: 'Papua Nuova Guinea' } },
  { code: 'py', flagUrl: 'https://flagcdn.com/w160/py.png', names: { es: 'Paraguay', en: 'Paraguay', it: 'Paraguay' } },
  { code: 'pe', flagUrl: 'https://flagcdn.com/w160/pe.png', names: { es: 'Peru', en: 'Peru', it: 'Peru' } },
  { code: 'pl', flagUrl: 'https://flagcdn.com/w160/pl.png', names: { es: 'Polonia', en: 'Poland', it: 'Polonia' } },
  { code: 'pt', flagUrl: 'https://flagcdn.com/w160/pt.png', names: { es: 'Portugal', en: 'Portugal', it: 'Portogallo' } },
  { code: 'gb', flagUrl: 'https://flagcdn.com/w160/gb.png', names: { es: 'Reino Unido', en: 'United Kingdom', it: 'Regno Unito' } },
  { code: 'cf', flagUrl: 'https://flagcdn.com/w160/cf.png', names: { es: 'Republica Centroafricana', en: 'Central African Republic', it: 'Repubblica Centrafricana' } },
  { code: 'cz', flagUrl: 'https://flagcdn.com/w160/cz.png', names: { es: 'Republica Checa', en: 'Czech Republic', it: 'Repubblica Ceca' } },
  { code: 'cg', flagUrl: 'https://flagcdn.com/w160/cg.png', names: { es: 'Republica del Congo', en: 'Republic of the Congo', it: 'Repubblica del Congo' } },
  { code: 'cd', flagUrl: 'https://flagcdn.com/w160/cd.png', names: { es: 'Republica Democratica del Congo', en: 'Democratic Republic of the Congo', it: 'Repubblica Democratica del Congo' } },
  { code: 'do', flagUrl: 'https://flagcdn.com/w160/do.png', names: { es: 'Republica Dominicana', en: 'Dominican Republic', it: 'Repubblica Dominicana' } },
  { code: 'rw', flagUrl: 'https://flagcdn.com/w160/rw.png', names: { es: 'Ruanda', en: 'Rwanda', it: 'Ruanda' } },
  { code: 'ro', flagUrl: 'https://flagcdn.com/w160/ro.png', names: { es: 'Rumania', en: 'Romania', it: 'Romania' } },
  { code: 'ru', flagUrl: 'https://flagcdn.com/w160/ru.png', names: { es: 'Rusia', en: 'Russia', it: 'Russia' } },
  { code: 'ws', flagUrl: 'https://flagcdn.com/w160/ws.png', names: { es: 'Samoa', en: 'Samoa', it: 'Samoa' } },
  { code: 'kn', flagUrl: 'https://flagcdn.com/w160/kn.png', names: { es: 'San Cristobal y Nieves', en: 'Saint Kitts and Nevis', it: 'Saint Kitts e Nevis' } },
  { code: 'sm', flagUrl: 'https://flagcdn.com/w160/sm.png', names: { es: 'San Marino', en: 'San Marino', it: 'San Marino' } },
  { code: 'vc', flagUrl: 'https://flagcdn.com/w160/vc.png', names: { es: 'San Vicente y las Granadinas', en: 'Saint Vincent and the Grenadines', it: 'Saint Vincent e Grenadine' } },
  { code: 'lc', flagUrl: 'https://flagcdn.com/w160/lc.png', names: { es: 'Santa Lucia', en: 'Saint Lucia', it: 'Santa Lucia' } },
  { code: 'st', flagUrl: 'https://flagcdn.com/w160/st.png', names: { es: 'Santo Tome y Principe', en: 'Sao Tome and Principe', it: 'Sao Tome e Principe' } },
  { code: 'sn', flagUrl: 'https://flagcdn.com/w160/sn.png', names: { es: 'Senegal', en: 'Senegal', it: 'Senegal' } },
  { code: 'rs', flagUrl: 'https://flagcdn.com/w160/rs.png', names: { es: 'Serbia', en: 'Serbia', it: 'Serbia' } },
  { code: 'sc', flagUrl: 'https://flagcdn.com/w160/sc.png', names: { es: 'Seychelles', en: 'Seychelles', it: 'Seychelles' } },
  { code: 'sl', flagUrl: 'https://flagcdn.com/w160/sl.png', names: { es: 'Sierra Leona', en: 'Sierra Leone', it: 'Sierra Leone' } },
  { code: 'sg', flagUrl: 'https://flagcdn.com/w160/sg.png', names: { es: 'Singapur', en: 'Singapore', it: 'Singapore' } },
  { code: 'sy', flagUrl: 'https://flagcdn.com/w160/sy.png', names: { es: 'Siria', en: 'Syria', it: 'Siria' } },
  { code: 'so', flagUrl: 'https://flagcdn.com/w160/so.png', names: { es: 'Somalia', en: 'Somalia', it: 'Somalia' } },
  { code: 'lk', flagUrl: 'https://flagcdn.com/w160/lk.png', names: { es: 'Sri Lanka', en: 'Sri Lanka', it: 'Sri Lanka' } },
  { code: 'sz', flagUrl: 'https://flagcdn.com/w160/sz.png', names: { es: 'Suazilandia', en: 'Eswatini', it: 'Eswatini' } },
  { code: 'za', flagUrl: 'https://flagcdn.com/w160/za.png', names: { es: 'Sudafrica', en: 'South Africa', it: 'Sudafrica' } },
  { code: 'sd', flagUrl: 'https://flagcdn.com/w160/sd.png', names: { es: 'Sudan', en: 'Sudan', it: 'Sudan' } },
  { code: 'ss', flagUrl: 'https://flagcdn.com/w160/ss.png', names: { es: 'Sudan del Sur', en: 'South Sudan', it: 'Sudan del Sud' } },
  { code: 'se', flagUrl: 'https://flagcdn.com/w160/se.png', names: { es: 'Suecia', en: 'Sweden', it: 'Svezia' } },
  { code: 'ch', flagUrl: 'https://flagcdn.com/w160/ch.png', names: { es: 'Suiza', en: 'Switzerland', it: 'Svizzera' } },
  { code: 'sr', flagUrl: 'https://flagcdn.com/w160/sr.png', names: { es: 'Surinam', en: 'Suriname', it: 'Suriname' } },
  { code: 'th', flagUrl: 'https://flagcdn.com/w160/th.png', names: { es: 'Tailandia', en: 'Thailand', it: 'Thailandia' } },
  { code: 'tz', flagUrl: 'https://flagcdn.com/w160/tz.png', names: { es: 'Tanzania', en: 'Tanzania', it: 'Tanzania' } },
  { code: 'tj', flagUrl: 'https://flagcdn.com/w160/tj.png', names: { es: 'Tayikistan', en: 'Tajikistan', it: 'Tagikistan' } },
  { code: 'tl', flagUrl: 'https://flagcdn.com/w160/tl.png', names: { es: 'Timor Oriental', en: 'East Timor', it: 'Timor Est' } },
  { code: 'tg', flagUrl: 'https://flagcdn.com/w160/tg.png', names: { es: 'Togo', en: 'Togo', it: 'Togo' } },
  { code: 'to', flagUrl: 'https://flagcdn.com/w160/to.png', names: { es: 'Tonga', en: 'Tonga', it: 'Tonga' } },
  { code: 'tt', flagUrl: 'https://flagcdn.com/w160/tt.png', names: { es: 'Trinidad y Tobago', en: 'Trinidad and Tobago', it: 'Trinidad e Tobago' } },
  { code: 'tn', flagUrl: 'https://flagcdn.com/w160/tn.png', names: { es: 'Tunez', en: 'Tunisia', it: 'Tunisia' } },
  { code: 'tm', flagUrl: 'https://flagcdn.com/w160/tm.png', names: { es: 'Turkmenistan', en: 'Turkmenistan', it: 'Turkmenistan' } },
  { code: 'tr', flagUrl: 'https://flagcdn.com/w160/tr.png', names: { es: 'Turquia', en: 'Turkey', it: 'Turchia' } },
  { code: 'tv', flagUrl: 'https://flagcdn.com/w160/tv.png', names: { es: 'Tuvalu', en: 'Tuvalu', it: 'Tuvalu' } },
  { code: 'ua', flagUrl: 'https://flagcdn.com/w160/ua.png', names: { es: 'Ucrania', en: 'Ukraine', it: 'Ucraina' } },
  { code: 'ug', flagUrl: 'https://flagcdn.com/w160/ug.png', names: { es: 'Uganda', en: 'Uganda', it: 'Uganda' } },
  { code: 'uy', flagUrl: 'https://flagcdn.com/w160/uy.png', names: { es: 'Uruguay', en: 'Uruguay', it: 'Uruguay' } },
  { code: 'uz', flagUrl: 'https://flagcdn.com/w160/uz.png', names: { es: 'Uzbekistan', en: 'Uzbekistan', it: 'Uzbekistan' } },
  { code: 'vu', flagUrl: 'https://flagcdn.com/w160/vu.png', names: { es: 'Vanuatu', en: 'Vanuatu', it: 'Vanuatu' } },
  { code: 'va', flagUrl: 'https://flagcdn.com/w160/va.png', names: { es: 'Vaticano', en: 'Vatican City', it: 'Citta del Vaticano' } },
  { code: 've', flagUrl: 'https://flagcdn.com/w160/ve.png', names: { es: 'Venezuela', en: 'Venezuela', it: 'Venezuela' } },
  { code: 'vn', flagUrl: 'https://flagcdn.com/w160/vn.png', names: { es: 'Vietnam', en: 'Vietnam', it: 'Vietnam' } },
  { code: 'ye', flagUrl: 'https://flagcdn.com/w160/ye.png', names: { es: 'Yemen', en: 'Yemen', it: 'Yemen' } },
  { code: 'dj', flagUrl: 'https://flagcdn.com/w160/dj.png', names: { es: 'Yibuti', en: 'Djibouti', it: 'Gibuti' } },
  { code: 'zm', flagUrl: 'https://flagcdn.com/w160/zm.png', names: { es: 'Zambia', en: 'Zambia', it: 'Zambia' } },
  { code: 'zw', flagUrl: 'https://flagcdn.com/w160/zw.png', names: { es: 'Zimbabue', en: 'Zimbabwe', it: 'Zimbabwe' } },
];

export function getCountryName(code: string, language: Language): string {
  const country = COUNTRIES.find(c => c.code === code);
  if (!country) return code;
  return country.names[language] || country.names.es;
}

export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByName(name: string): CountryData | undefined {
  const normalizedName = name.toLowerCase().trim();
  return COUNTRIES.find(c =>
    c.names.es.toLowerCase() === normalizedName ||
    c.names.en.toLowerCase() === normalizedName ||
    c.names.it.toLowerCase() === normalizedName
  );
}

export function getTranslatedCountryName(countryCode: string | null | undefined, storedName: string, language: Language): string {
  if (countryCode) {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      return country.names[language] || country.names.es;
    }
  }

  const countryByName = getCountryByName(storedName);
  if (countryByName) {
    return countryByName.names[language] || countryByName.names.es;
  }

  return storedName;
}

export function getCountriesSortedByLanguage(language: Language): CountryData[] {
  return [...COUNTRIES].sort((a, b) =>
    a.names[language].localeCompare(b.names[language])
  );
}
