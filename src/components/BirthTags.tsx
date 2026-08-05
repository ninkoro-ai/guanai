import type { BirthProfile } from '../utils/date';

/** 生日衍生标签：年龄 / 属相 / 星座 / 本命年；仅含出生年份时显示 */
export function BirthTags({ profile }: { profile: BirthProfile }) {
  if (!profile.hasYear) return null;
  const tags: string[] = [];
  if (profile.age != null) tags.push(`${profile.age}岁`);
  if (profile.zodiac) tags.push(`属${profile.zodiac}`);
  if (profile.sign) tags.push(`${profile.sign}座`);
  if (tags.length === 0 && !profile.zodiacYear) return null;
  return (
    <div className="tags">
      {profile.zodiacYear ? <span className="tag tag-year">本命年</span> : null}
      {tags.map((t) => (
        <span key={t} className="tag">{t}</span>
      ))}
    </div>
  );
}
