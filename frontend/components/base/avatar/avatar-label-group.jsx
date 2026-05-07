"use client";

export function AvatarLabelGroup({
  size = "md",
  src,
  alt = "",
  title,
  subtitle,
}) {
  const sizeMap = {
    sm: { avatar: "w-9 h-9", title: "text-sm", subtitle: "text-xs" },
    md: { avatar: "w-12 h-12", title: "text-sm", subtitle: "text-xs" },
    lg: { avatar: "w-14 h-14", title: "text-base", subtitle: "text-sm" },
  };
  const conf = sizeMap[size] || sizeMap.md;
  const initials = (title || alt || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${conf.avatar} rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900 shadow-lg shadow-black/5`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center bg-gradient-to-br from-brandA to-brandB text-white font-black">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className={`${conf.title} font-black truncate text-slate-900 dark:text-white`}>
          {title}
        </p>
        <p className={`${conf.subtitle} text-slate-500 dark:text-slate-300 truncate`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

