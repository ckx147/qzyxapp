/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AVATARS } from '../utils/gameHelpers';

interface UserAvatarProps {
  id: string;
  className?: string; // e.g. "w-8 h-8"
  textClassName?: string; // e.g. "text-base" or "text-4xl"
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  id,
  className = "w-8 h-8",
  textClassName = "text-sm",
}) => {
  const isCustomImage = id && (
    id.startsWith('data:image/') || 
    id.startsWith('blob:') || 
    id.startsWith('http://') || 
    id.startsWith('https://')
  );

  if (isCustomImage) {
    return (
      <img
        src={id}
        alt="User Custom Avatar"
        referrerPolicy="no-referrer"
        className={`${className} aspect-square object-cover rounded-full border-2 border-white shadow-inner shrink-0`}
      />
    );
  }

  // Find preset and render
  const preset = AVATARS.find(a => a.id === id) || AVATARS[0];
  return (
    <div 
      className={`${className} rounded-full ${preset.color} border-2 border-white flex items-center justify-center ${textClassName} shadow-inner shrink-0 leading-none select-none`}
    >
      {preset.char}
    </div>
  );
};
