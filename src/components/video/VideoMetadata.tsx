
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface VideoMetadataProps {
  title: string;
  description?: string;
  categories?: string[];
}

const VideoMetadata: React.FC<VideoMetadataProps> = ({
  title,
  description,
  categories
}) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-3">{description}</p>}
      
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <Badge key={index} variant="outline" className="capitalize">
              {typeof category === 'string' ? category.replace(/-/g, ' ') : category}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoMetadata;
