import requests
import boto3 as aws
from botocore import UNSIGNED
import datetime as dt
import pyart
import cartopy.crs as ccrs
import matplotlib.pyplot as plt
import PIL as img
import io
import numpy as np
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
class RadarData:
    radar_sites = ['KTLX', 'KINX', 'KVNX', 'KGRK', 'KHPX', 'KDGX', 'KABR', 'KCBX', 'KICX', 'KLVX', 'KMAX', 'KTLH', 'KAMX', 'KBMX', 'KFFC', 'KJGX', 'KCLX', 'KCRP', 'KDOX', 'KDTX', 'KEPZ', 'KFCX', 'KFDR', 'KFWS', 'KGGW', 'KGJX', 'KGLD', 'KGRB', 'KGRR', 'KGSP', 'KGWX', 'KHNX', 'KHTX', 'KICT', 'KILX', 'KIND', 'KINX', 'KIWA', 'KJKL', 'KLBB', 'KLCH', 'KLIX', 'KLNX', 'KLOT', 'KLVX', 'KLYH', 'KMAF', 'KMAX', 'KMHX', 'KMKX', 'KMOB', 'KMPX', 'KMQT', 'KMSX', 'KMTX', 'KMUX', 'KMVX', 'KNKX', 'KNQA', 'KOAX', 'KOHX', 'KOKX', 'KOTX', 'KPAH', 'KPBZ', 'KPDT', 'KPUX', 'KRAX', 'KRGX', 'KRIW', 'KRLX', 'KRTX', 'KSFX', 'KSGF', 'KSHV', 'KSJT', 'KSOX', 'KSRX', 'KTBW', 'KTFX', 'KTLH', 'KTLX', 'KTWX', 'KTYX', 'KUDX', 'KUEX', 'KVNX', 'KVTX', 'KVWX', 'KYUX', 'PABC', 'PACG', 'PAEC', 'PAHG']

    def __init__(self):
        
        self.s3 = aws.client('s3', config=aws.session.Config(signature_version=UNSIGNED))

        self.bucket = 'noaa-nexrad-level2'
        
    def gen_url(self,time_period: dt.datetime, radar_site: str):
        # url = f'{radar_site}_N0Q_{time_period.year:04d}_{time_period.month:02d}_{time_period.day:02d}_{time_period.hour:02d}_{time_period.minute:02d}_{time_period.second:02d}'
        url = f'/{time_period.year:04d}/{time_period.month:02d}/{time_period.day:02d}/{radar_site}/{radar_site}{time_period.strftime("%Y%m%d_%H%M%S")}_V06'
        return url
        
        

    def download_radar_data(self,start_time,end_time, radar_site: str):
        
        
        start_time = dt.datetime.strptime(start_time, '%Y-%m-%d:%H:%M')
        end_time = dt.datetime.strptime(end_time, '%Y-%m-%d:%H:%M')
        
        while start_time < end_time:
            url = self.gen_url(start_time, radar_site)
            print(f"URL: {url}")
            reflectivity_file = self.s3.get_object(Bucket=self.bucket, Key=url)
            with open(f'/radar/{url}', 'wb') as file:
                file.write(reflectivity_file['Body'].read())
            start_time += dt.timedelta(minutes=5)
    
    def process_radar_data_to_image(self, file_path):
        radar = pyart.io.read_nexrad_level3(file_path)
        # Convert radar data to image
        image = radar.get_field(0, 'reflectivity')
        image = pyart.graph.RadarDisplay(image)
        image = img.Image.fromarray(image)

        # Save image to memory
        output = io.BytesIO()
        image.save(output, format='PNG')
        output.seek(0)

        # Do something with the image in memory
        # For example, return the image as bytes
        image_bytes = output.getvalue()
        return image_bytes
    
    def convert_radar_data_to_array(self, file_path):
        radar = pyart.io.read_nexrad_archive(file_path)
        return radar.fields['reflectivity']['data']
        
    def display_3d_radar_data(self, file_path):
        # Display 3D radar data
        radar = pyart.io.read_nexrad_archive(file_path)

        # Get the data
        data = radar.fields['reflectivity']['data']
        r = radar.range['data']
        azimuths = np.deg2rad(radar.azimuth['data'])
        elevations = np.deg2rad(radar.elevation['data'])

        # Downsample the data
        data = data[::2, ::2]
        r = r[::2]
        azimuths = azimuths[::2]
        elevations = elevations[::2]

        # Initialize arrays for Cartesian coordinates
        x = np.empty_like(data)
        y = np.empty_like(data)
        z = np.empty_like(data)

        # Convert to Cartesian coordinates
        for i in range(data.shape[0]):
            for j in range(data.shape[1]):
                x[i, j] = r[j] * np.sin(elevations[i]) * np.cos(azimuths[i])
                y[i, j] = r[j] * np.sin(elevations[i]) * np.sin(azimuths[i])
                z[i, j] = r[j] * np.cos(elevations[i])

        # Normalize to [0,1]
        norm = plt.Normalize(data.min(), data.max())
        colors = cm.get_cmap('viridis')(norm(data))
        rcount, ccount, _ = colors.shape

        # Create the figure
        fig = plt.figure(figsize=(10, 10))
        ax = fig.add_subplot(111, projection='3d')

        # Plot the data
        surf = ax.plot_surface(x, y, z, rcount=rcount, ccount=ccount,
                            facecolors=colors, shade=False)
        surf.set_facecolor((0,0,0,0))

        # Set labels and title
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.set_title('3D Radar Data')

        # Show the plot
        plt.show()

if __name__ == '__main__':
    radar_data = RadarData()
    # radar_data.display_radar_data('/users/dj/radar/KFTG20230510_042019_V06')
    # shader = radar_data.convert_image_to_shader('/users/dj/radar/KFTG20230510_042019_V06')
    print(radar_data.convert_radar_data_to_array('/users/dj/radar/KFTG20230510_042019_V06'))
    # radar_data.display_3d_radar_data('/users/dj/radar/KFTG20230510_042019_V06')
    