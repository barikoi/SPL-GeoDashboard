import pandas as pd
from shapely.geometry import Point, Polygon

# Define the polygon from GeoJSON
polygon_coords = [
    (46.68906593466065, 24.63985406962385),
    (46.68947449339325, 24.63453280031659),
    (46.694243487629876, 24.628838037792647),
    (46.7040574679983, 24.63032423881552),
    (46.714005379424094, 24.63565097172031),
    (46.71400825421935, 24.640483153282275),
    (46.71291701349901, 24.644446869224723),
    (46.7026927552042, 24.649026826111225),
    (46.69560264710353, 24.647529866448252),
    (46.68906593466065, 24.63985406962385)
]
polygon = Polygon(polygon_coords)

# Load the CSV file
df = pd.read_csv("order_loc.csv")

# Function to check if a point is inside the polygon
def is_inside_polygon(lat, lon):
    point = Point(lon, lat)  # Note: (lon, lat) order for Shapely
    return polygon.contains(point)

# Apply filtering
df_filtered = df[df.apply(lambda row: is_inside_polygon(row["Latitude"], row["Longitude"]), axis=1)]

# Save to a new CSV file
df_filtered.to_csv("filtered_data.csv", index=False)

print(f"Filtered data saved to 'filtered_data.csv'. Rows: {len(df_filtered)}")