import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const getAvatars = () => import('../src/avatar.js');

test('default avatar configurations are complete, valid, and independent', async () => {
  const { createAvatar, isAvatar, avatarLayers } = await getAvatars();
  const first = createAvatar();
  assert.deepEqual(first, { hair: 'shaved', hairColor: 'ink', clothing: 'tee', accessory: 'none', facialHair: 'none', pose: 'bust', expression: 'none' });
  assert.equal(isAvatar(first), true);
  assert.equal(avatarLayers(first).some((layer) => layer.key === 'expression'), false);
  const second = createAvatar();
  assert.notEqual(first, second);
  first.hair = 'afro';
  assert.equal(second.hair, 'shaved');
});

test('every curated avatar option produces a valid configuration', async () => {
  const { avatarOptions, createAvatar, isAvatar } = await getAvatars();
  for (const [field, options] of Object.entries(avatarOptions)) {
    assert.ok(options.length > 0);
    assert.equal(new Set(options.map((option) => option.id)).size, options.length);
    for (const option of options) {
      const avatar = createAvatar({ [field]: option.id });
      assert.equal(avatar[field], option.id);
      assert.equal(isAvatar(avatar), true);
      assert.ok(option.label);
    }
  }
});

test('expression options cover all 30 face elements from the supplied Open Peeps archive', async () => {
  const { avatarOptions } = await getAvatars();
  const manifest = JSON.parse(await readFile(resolve('public/assets/open-peeps/manifest.json'), 'utf8'));
  const faces = manifest.assets.filter((asset) => asset.category === 'expression');
  const expectedFaces = [
    'Angry with Fang', 'Awe', 'Blank', 'Calm', 'Cheeky', 'Concerned Fear', 'Concerned',
    'Contempt', 'Cute', 'Cyclops', 'Driven', 'Eating Happy', 'Explaining', 'Eyes Closed',
    'Fear', 'Hectic', 'Loving Grin 1', 'Loving Grin 2', 'Monster', 'Old', 'Rage',
    'Serious', 'Smile Big', 'Smile LOL', 'Smile Teeth Gap', 'Smile', 'Solemn',
    'Suspicious', 'Tired', 'Very Angry',
  ];
  assert.deepEqual(faces.map((face) => face.source.split('/').at(-1).replace(/\.svg$/, '')).sort(), expectedFaces.sort());
  assert.deepEqual(avatarOptions.expression.filter((option) => option.id !== 'none').map((option) => option.id).sort(), faces.map((face) => face.id).sort());
  assert.equal(avatarOptions.expression.filter((option) => option.id === 'none').length, 1);
});

test('hair style options cover all 46 head elements from the supplied Open Peeps archive', async () => {
  const { avatarOptions } = await getAvatars();
  const manifest = JSON.parse(await readFile(resolve('public/assets/open-peeps/manifest.json'), 'utf8'));
  const heads = manifest.assets.filter((asset) => asset.category === 'head');
  const expectedHeads = [
    'Afro', 'Bangs 2', 'Bangs', 'Bantu Knots', 'Bear', 'Bun 2', 'Bun', 'Buns',
    'Cornrows 2', 'Cornrows', 'Flat Top Long', 'Flat Top', 'Gray Bun', 'Gray Medium',
    'Gray Short', 'Hijab', 'Long Afro', 'Long Bangs', 'Long Curly', 'Long',
    'Medium 1', 'Medium 2', 'Medium 3', 'Medium Bangs 2', 'Medium Bangs 3',
    'Medium Bangs', 'Medium Straight', 'Mohawk 2', 'Mohawk', 'No Hair 1',
    'No Hair 2', 'No Hair 3', 'Pomp', 'Shaved 1', 'Shaved 2', 'Shaved 3',
    'Short 1', 'Short 2', 'Short 3', 'Short 4', 'Short 5', 'Turban', 'Twists 2',
    'Twists', 'hat-beanie', 'hat-hip',
  ];
  assert.deepEqual(heads.map((head) => head.source.split('/').at(-1).replace(/\.svg$/, '')).sort(), expectedHeads.sort());
  assert.deepEqual(avatarOptions.hair.map((option) => option.id).sort(), heads.map((head) => head.id).sort());
});

for (const [field, category, names] of [
  ['clothing', 'clothing', ['Blazer Black Tee', 'Button Shirt 1', 'Button Shirt 2', 'Coffee', 'Device', 'Dress', 'Explaining', 'Fur Jacket', 'Gaming', 'Gym Shirt', 'Hoodie', 'Killer', 'Macbook', 'Paper', 'Pointing Up', 'Polka Dot Jacket', 'Polo and Sweater', 'Shirt and Coat', 'Sporty Tee', 'Striped Pocket Tee', 'Striped Tee', 'Sweater Dots', 'Sweater', 'Tee 1', 'Tee 2', 'Tee Arms Crossed', 'Tee Selena', 'Thunder T-Shirt', 'Turtleneck', 'Whatever']],
  ['accessory', 'accessory', ['* None', 'Eyepatch', 'Glasses 2', 'Glasses 3', 'Glasses 4', 'Glasses 5', 'Glasses', 'Sunglasses 2', 'Sunglasses']],
  ['facialHair', 'facialHair', ['* None', 'Chin', 'Full 2', 'Full 3', 'Full 4', 'Full', 'Goatee 1', 'Goatee 2', 'Moustache 1', 'Moustache 2', 'Moustache 3', 'Moustache 4', 'Moustache 5', 'Moustache 6', 'Moustache 7', 'Moustache 8', 'Moustache 9']],
]) {
  test(`${field} options cover all ${names.length} source elements in the supplied archive`, async () => {
    const { avatarOptions } = await getAvatars();
    const manifest = JSON.parse(await readFile(resolve('public/assets/open-peeps/manifest.json'), 'utf8'));
    const assets = manifest.assets.filter((asset) => asset.category === category);
    assert.deepEqual(assets.map((asset) => asset.source.split('/').at(-1).replace(/\.svg$/, '')).sort(), names.toSorted());
    assert.deepEqual(avatarOptions[field].map((option) => option.id).sort(), assets.map((asset) => asset.id).sort());
  });
}

test('eyewear and facial hair can be selected and cleared independently', async () => {
  const { avatarLayers, createAvatar } = await getAvatars();
  const combined = createAvatar({ accessory: 'glasses-5', facialHair: 'moustache-9', expression: 'calm' });
  assert.equal(combined.accessory, 'glasses-5');
  assert.equal(combined.facialHair, 'moustache-9');
  assert.deepEqual(avatarLayers(combined).map((layer) => layer.key), ['clothing', 'hair', 'expression', 'facialHair', 'accessory']);
  const noEyewear = createAvatar({ ...combined, accessory: 'none' });
  assert.equal(noEyewear.facialHair, 'moustache-9');
  assert.equal(avatarLayers(noEyewear).some((layer) => layer.key === 'accessory'), false);
  const noFacialHair = createAvatar({ ...combined, facialHair: 'none' });
  assert.equal(noFacialHair.accessory, 'glasses-5');
  assert.equal(avatarLayers(noFacialHair).some((layer) => layer.key === 'facialHair'), false);
});

test('avatar validation rejects incomplete, unknown, and malformed selections', async () => {
  const { createAvatar, isAvatar } = await getAvatars();
  for (const invalid of [null, undefined, [], {}, 'avatar', { ...createAvatar(), hair: '../remote' }, { ...createAvatar(), expression: null }, { ...createAvatar(), private: 'injected' }]) {
    assert.equal(isAvatar(invalid), false);
  }
  const defaults = createAvatar();
  for (const field of Object.keys(defaults)) {
    const incomplete = { ...defaults };
    delete incomplete[field];
    assert.equal(isAvatar(incomplete), false);
    assert.equal(isAvatar({ ...defaults, [field]: {} }), false);
  }
  assert.deepEqual(createAvatar({ hair: '../remote', private: 'injected' }), defaults);
});

test('avatar layers use local assets and preserve the source bust placements', async () => {
  const { avatarLayers, createAvatar } = await getAvatars();
  const layers = avatarLayers(createAvatar({ accessory: 'glasses', facialHair: 'full', expression: 'calm' }));
  assert.deepEqual(layers.map(({ key, x, y, width, height }) => ({ key, x, y, width, height })), [
    { key: 'clothing', x: 147, y: 639, width: 818, height: 733 },
    { key: 'hair', x: 372, y: 180, width: 473, height: 567 },
    { key: 'expression', x: 531, y: 366, width: 289, height: 293 },
    { key: 'facialHair', x: 494.999934, y: 517.999659, width: 280, height: 230 },
    { key: 'accessory', x: 419, y: 421, width: 392, height: 138 },
  ]);
  assert.equal(avatarLayers(createAvatar()).some((layer) => layer.key === 'accessory'), false);
  assert.ok(avatarLayers({ hair: 'https://example.com/private' }).every((layer) => layer.href.startsWith('/assets/open-peeps/')));
});

test('every curated asset exists locally with its original SVG dimensions and no executable dependencies', async () => {
  const { avatarOptions, avatarLayers, createAvatar } = await getAvatars();
  const layers = new Map();
  for (const [field, options] of Object.entries(avatarOptions)) {
    for (const option of options) {
      const selections = field === 'hair' ? avatarOptions.hairColor.map((color) => createAvatar({ hair: option.id, hairColor: color.id })) : [createAvatar({ [field]: option.id })];
      for (const avatar of selections) for (const layer of avatarLayers(avatar)) layers.set(layer.href, layer);
    }
  }
  for (const layer of layers.values()) {
    const svg = await readFile(resolve('public', layer.href.slice(1)), 'utf8');
    assert.ok(svg.length > 100);
    assert.match(svg, new RegExp(`width="${layer.width}px"`));
    assert.match(svg, new RegExp(`height="${layer.height}px"`));
    assert.match(svg, /<g id="avatar-part">/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)/i);
  }
});
