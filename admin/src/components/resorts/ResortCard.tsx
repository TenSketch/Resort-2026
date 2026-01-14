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
      className="max-w-sm bg-white shadow-md rounded-xl p-4 border border-gray-200 text-center cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-24 h-24 rounded-full mx-auto object-cover"
        />
      ) : (
        <div className="w-24 h-24 rounded-full mx-auto bg-slate-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-500">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <h2 className="text-lg font-semibold text-pink-600 mt-2">{name}</h2>
      <p className="text-gray-600 text-sm mt-1">
        <MapPin className="inline mr-1 text-blue-500 w-4 h-4" />
        {address}
      </p>
      <div className="flex flex-col gap-1 items-center mt-4 text-sm text-pink-700 font-medium">
        <p className="flex items-center gap-1">
          <Phone className="w-4 h-4" /> {phone}
        </p>
        <p className="flex items-center gap-1">
          <Mail className="w-4 h-4" /> {email}
        </p>
      </div>
    </div>
  );
};

export default ResortCard;
