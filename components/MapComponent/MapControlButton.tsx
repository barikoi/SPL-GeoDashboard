import { Tooltip } from "antd";
import React from "react";

interface MapControlButtonProps {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  isActive: boolean;
}

const MapControlButton: React.FC<MapControlButtonProps> = ({
  title,
  onClick,
  icon,
  isActive,
}) => {
  return (
    <div>
      <Tooltip title={title} placement="left">
        <button
          onClick={onClick}
          style={{
            padding: "4px 5px",
            backgroundColor: isActive ? "#82CD47" : "#ffffff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "10px",
            fontSize: "20px",
            boxShadow:
              "rgba(60, 64, 67, 0.1) 0px 0px 0px 2px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px",
          }}
        >
          {icon}
        </button>
      </Tooltip>
    </div>
  );
};

export default MapControlButton;