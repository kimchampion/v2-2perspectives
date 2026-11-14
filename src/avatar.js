import { publicAsset } from './public-assets.js';

const options = {
  hair: [
    // Vector tops measured in the original bust coordinates, for the fitted preview.
    { id: 'short', label: 'Short hair', topY: 242 },
    { id: 'afro', label: 'Afro', topY: 187.999 },
    { id: 'long', label: 'Long hair', topY: 211.843 },
    { id: 'shaved', label: 'No hair', topY: 245 },
    { id: 'hijab', label: 'Hijab', topY: 216.999 },
    { id: 'turban', label: 'Turban', topY: 181.001 },
    { id: 'bangs', label: 'Bangs', topY: 236 },
    { id: 'bangs-2', label: 'Bangs 2', topY: 230 },
    { id: 'bantu-knots', label: 'Bantu knots', topY: 183 },
    { id: 'bear', label: 'Bear', topY: 204 },
    { id: 'bun', label: 'Bun', topY: 114 },
    { id: 'bun-2', label: 'Bun 2', topY: 82.999 },
    { id: 'buns', label: 'Buns', topY: 152 },
    { id: 'cornrows', label: 'Cornrows', topY: 208 },
    { id: 'cornrows-2', label: 'Cornrows 2', topY: 203 },
    { id: 'flat-top', label: 'Flat top', topY: 225 },
    { id: 'flat-top-long', label: 'Flat top long', topY: 177 },
    { id: 'gray-bun', label: 'Gray bun', topY: 186 },
    { id: 'gray-medium', label: 'Gray medium', topY: 235 },
    { id: 'gray-short', label: 'Gray short', topY: 232 },
    { id: 'long-afro', label: 'Long afro', topY: 60 },
    { id: 'long-bangs', label: 'Long bangs', topY: 227 },
    { id: 'long-curly', label: 'Long curly', topY: 138 },
    { id: 'medium-1', label: 'Medium 1', topY: 238 },
    { id: 'medium-2', label: 'Medium 2', topY: 242 },
    { id: 'medium-3', label: 'Medium 3', topY: 240 },
    { id: 'medium-bangs', label: 'Medium bangs', topY: 228 },
    { id: 'medium-bangs-2', label: 'Medium bangs 2', topY: 229 },
    { id: 'medium-bangs-3', label: 'Medium bangs 3', topY: 194 },
    { id: 'medium-straight', label: 'Medium straight', topY: 222 },
    { id: 'mohawk', label: 'Mohawk', topY: 167.001 },
    { id: 'mohawk-2', label: 'Mohawk 2', topY: 180 },
    { id: 'no-hair-2', label: 'No hair 2', topY: 225 },
    { id: 'no-hair-3', label: 'No hair 3', topY: 236 },
    { id: 'pomp', label: 'Pomp', topY: 180 },
    { id: 'shaved-1', label: 'Shaved 1', topY: 185.001 },
    { id: 'shaved-2', label: 'Shaved 2', topY: 165 },
    { id: 'shaved-3', label: 'Shaved 3', topY: 149 },
    { id: 'short-2', label: 'Short hair 2', topY: 245 },
    { id: 'short-3', label: 'Short hair 3', topY: 248.001 },
    { id: 'short-4', label: 'Short hair 4', topY: 195.001 },
    { id: 'short-5', label: 'Short hair 5', topY: 234.999 },
    { id: 'twists', label: 'Twists', topY: 180.999 },
    { id: 'twists-2', label: 'Twists 2', topY: 192 },
    { id: 'hat-beanie', label: 'Beanie', topY: 231 },
    { id: 'hat-hip', label: 'Hip hat', topY: 198 },
  ],
  hairColor: [
    { id: 'ink', label: 'Black', color: '#1F1F1F' },
  ],
  clothing: [
    // Vector bottoms measured in the original bust coordinates, for the flush preview.
    { id: 'tee', label: 'T-shirt', baseY: 1345.377 },
    { id: 'hoodie', label: 'Hoodie', baseY: 1374.62 },
    { id: 'sweater', label: 'Sweater', baseY: 1371.158 },
    { id: 'blazer-black-tee', label: 'Blazer and black tee', baseY: 1352.634 },
    { id: 'button-shirt-1', label: 'Button shirt 1', baseY: 1371.252 },
    { id: 'button-shirt-2', label: 'Button shirt 2', baseY: 1390.892 },
    { id: 'coffee', label: 'Coffee', baseY: 1339.925 },
    { id: 'device', label: 'Device', baseY: 1344.644 },
    { id: 'dress', label: 'Dress', baseY: 1365.222 },
    { id: 'explaining', label: 'Explaining', baseY: 1336.831 },
    { id: 'fur-jacket', label: 'Fur jacket', baseY: 1367.593 },
    { id: 'gaming', label: 'Gaming', baseY: 1348.009 },
    { id: 'gym-shirt', label: 'Gym shirt', baseY: 1354.319 },
    { id: 'killer', label: 'Killer', baseY: 1337.635 },
    { id: 'macbook', label: 'MacBook', baseY: 1348.586 },
    { id: 'paper', label: 'Paper', baseY: 1349.541 },
    { id: 'pointing-up', label: 'Pointing up', baseY: 1336.585 },
    { id: 'polka-dot-jacket', label: 'Polka dot jacket', baseY: 1337.519 },
    { id: 'polo-and-sweater', label: 'Polo and sweater', baseY: 1352.246 },
    { id: 'shirt-and-coat', label: 'Shirt and coat', baseY: 1371.132 },
    { id: 'sporty-tee', label: 'Sporty tee', baseY: 1360.195 },
    { id: 'striped-pocket-tee', label: 'Striped pocket tee', baseY: 1343 },
    { id: 'striped-tee', label: 'Striped tee', baseY: 1343.958 },
    { id: 'sweater-dots', label: 'Sweater dots', baseY: 1372.153 },
    { id: 'tee-2', label: 'T-shirt 2', baseY: 1358.337 },
    { id: 'tee-arms-crossed', label: 'T-shirt, arms crossed', baseY: 1372.761 },
    { id: 'tee-selena', label: 'Tee Selena', baseY: 1363.678 },
    { id: 'thunder-t-shirt', label: 'Thunder T-shirt', baseY: 1357.663 },
    { id: 'turtleneck', label: 'Turtleneck', baseY: 1365.016 },
    { id: 'whatever', label: 'Whatever', baseY: 1324.641 },
  ],
  accessory: [
    { id: 'none', label: 'No accessory' },
    { id: 'glasses', label: 'Glasses' },
    { id: 'sunglasses', label: 'Sunglasses' },
    { id: 'eyepatch', label: 'Eyepatch' },
    { id: 'glasses-2', label: 'Glasses 2' },
    { id: 'glasses-3', label: 'Glasses 3' },
    { id: 'glasses-4', label: 'Glasses 4' },
    { id: 'glasses-5', label: 'Glasses 5' },
    { id: 'sunglasses-2', label: 'Sunglasses 2' },
  ],
  facialHair: [
    { id: 'none', label: 'No facial hair' },
    { id: 'chin', label: 'Chin beard' },
    { id: 'full', label: 'Full beard' },
    { id: 'full-2', label: 'Full beard 2' },
    { id: 'full-3', label: 'Full beard 3' },
    { id: 'full-4', label: 'Full beard 4' },
    { id: 'goatee-1', label: 'Goatee 1' },
    { id: 'goatee-2', label: 'Goatee 2' },
    { id: 'moustache-1', label: 'Moustache 1' },
    { id: 'moustache-2', label: 'Moustache 2' },
    { id: 'moustache-3', label: 'Moustache 3' },
    { id: 'moustache-4', label: 'Moustache 4' },
    { id: 'moustache-5', label: 'Moustache 5' },
    { id: 'moustache-6', label: 'Moustache 6' },
    { id: 'moustache-7', label: 'Moustache 7' },
    { id: 'moustache-8', label: 'Moustache 8' },
    { id: 'moustache-9', label: 'Moustache 9' },
  ],
  pose: [{ id: 'bust', label: 'Portrait' }],
  expression: [
    { id: 'none', label: 'No expression' },
    { id: 'calm', label: 'Calm' },
    { id: 'happy', label: 'Happy' },
    { id: 'sad', label: 'Sad' },
    { id: 'frustrated', label: 'Frustrated' },
    { id: 'unsure', label: 'Unsure' },
    { id: 'tired', label: 'Tired' },
    { id: 'angry-with-fang', label: 'Angry with fang' },
    { id: 'awe', label: 'Awe' },
    { id: 'blank', label: 'Blank' },
    { id: 'cheeky', label: 'Cheeky' },
    { id: 'concerned-fear', label: 'Concerned fear' },
    { id: 'contempt', label: 'Contempt' },
    { id: 'cute', label: 'Cute' },
    { id: 'cyclops', label: 'Cyclops' },
    { id: 'driven', label: 'Driven' },
    { id: 'eating-happy', label: 'Eating happy' },
    { id: 'explaining', label: 'Explaining' },
    { id: 'eyes-closed', label: 'Eyes closed' },
    { id: 'fear', label: 'Fear' },
    { id: 'hectic', label: 'Hectic' },
    { id: 'loving-grin-1', label: 'Loving grin 1' },
    { id: 'loving-grin-2', label: 'Loving grin 2' },
    { id: 'monster', label: 'Monster' },
    { id: 'old', label: 'Old' },
    { id: 'rage', label: 'Rage' },
    { id: 'serious', label: 'Serious' },
    { id: 'smile-big', label: 'Big smile' },
    { id: 'smile-lol', label: 'Laughing smile' },
    { id: 'smile-teeth-gap', label: 'Smile with teeth gap' },
    { id: 'suspicious', label: 'Suspicious' },
  ],
};

export const avatarOptions = Object.freeze(Object.fromEntries(
  Object.entries(options).map(([field, items]) => [field, Object.freeze(items.map(Object.freeze))]),
));

const defaults = Object.freeze({ hair: 'shaved', hairColor: 'ink', clothing: 'tee', accessory: 'none', facialHair: 'none', pose: 'bust', expression: 'none' });
const fields = Object.keys(defaults);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const known = (field, value) => avatarOptions[field].some((option) => option.id === value);

export function createAvatar(values) {
  const avatar = { ...defaults };
  if (isRecord(values)) {
    for (const field of fields) if (Object.hasOwn(values, field) && known(field, values[field])) avatar[field] = values[field];
  }
  return avatar;
}

export function isAvatar(value) {
  return isRecord(value) && Object.keys(value).length === fields.length
    && fields.every((field) => Object.hasOwn(value, field) && known(field, value[field]));
}

export function avatarOptionLabel(field, value) {
  return avatarOptions[field]?.find((option) => option.id === value)?.label || '';
}

export function avatarLayers(values) {
  const avatar = createAvatar(values);
  const root = publicAsset('assets/open-peeps/');
  const layers = [
    { key: 'clothing', href: `${root}clothing/${avatar.clothing}.svg`, x: 147, y: 639, width: 818, height: 733 },
    { key: 'hair', href: `${root}head/${avatar.hair}-${avatar.hairColor}.svg`, x: 372, y: 180, width: 473, height: 567 },
  ];
  if (avatar.expression !== 'none') layers.push({ key: 'expression', href: `${root}expression/${avatar.expression}.svg`, x: 531, y: 366, width: 289, height: 293 });
  if (avatar.facialHair !== 'none') layers.push({ key: 'facialHair', href: `${root}facial-hair/${avatar.facialHair}.svg`, x: 494.999934, y: 517.999659, width: 280, height: 230 });
  if (avatar.accessory !== 'none') layers.push({ key: 'accessory', href: `${root}accessory/${avatar.accessory}.svg`, x: 419, y: 421, width: 392, height: 138 });
  return layers;
}
