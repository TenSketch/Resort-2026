import { Mail, MapPin, Phone } from "lucide-react";

interface ResortCardProps {
  name: string;
  imageUrl: string;
  address: string;
  phone: string;
  email: string;
  onClick?: () => void;
}

const ResortCard = ({ name, imageUrl, address, phone, email, onClick }: ResortCardProps) => {
  return (
    <div 
      className="bg-white shadow-md rounded-xl border border-gray-200 cursor-pointer hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col sm:flex-row min-h-[200px]"
      onClick={onClick}
    >
      {/* Image Section - Left Side */}
      <div className="w-full sm:w-56 h-48 sm:h-auto flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-5xl font-bold text-pink-600">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Details Section - Right Side */}
      <div className="flex-1 p-5 flex flex-col justify-center">
        <h2 className="text-xl font-bold text-pink-600 mb-3">{name}</h2>
        
        <div className="space-y-2.5">
          <p className="text-gray-600 text-sm flex items-start gap-2">
            <MapPin className="text-blue-500 w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="flex-1 leading-relaxed">{address}</span>
          </p>
          
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <Phone className="text-green-500 w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{phone}</span>
          </p>
          
          <p className="text-gray-600 text-sm flex items-center gap-2">
            <Mail className="text-purple-500 w-4 h-4 flex-shrink-0" />
            <span className="font-medium break-all">{email}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
