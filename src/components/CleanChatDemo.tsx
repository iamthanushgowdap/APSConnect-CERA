"use client";

import React, { useState } from 'react';
import { CleanMessage } from '@/components/chat/CleanMessage';

export default function CleanChatDemo() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb8AAAEnCAYAAAA5Jk1cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe1P15uG5XVSWMj3Xuufem7276PkB6ICT0PYRAQGkEQeltEAVRS+uzrUJKxSpLSz/FEqUVlSiKiPSdBEhoEvqEJCaBEEISEtK3N915z1nfH3OOOcdce597L9b3/H7PN5P37L3Xms2YY8619n7fe5r2zsV7eusNaB3oDWgAOuya0psdx7FRl2M2KLqDDsVj9tZBDIwQrmlDfGobrqc+bd68FB3NgSKxTauZY4rGoj7HNVakaCfhS51pvjAfkXPwJ5xp7iMHZsSTiJN5JNbe+jyXNjjJiTnYUNporUIKt8QxcKjiMRPnlKMSjzrCbxOMPK+4BEca1vlOzLW26ctmTG3Ko+LQ/i11XI+EwKK5J6b0M9iTa8qI34X2I8YJZyAWMYbsBbwGAqti05m0ybwKrnWwU8YcJvUSv3NYtG/ShfTFrD+JozUJtfQ3yx11tQ6M71xM8mLsEa/UfaxbzImXep0+53N2zXWwTteP++wyN0rh0mVGX3nzE04EjyOWUT8yWIcb5hmINJfCQeouTZKidW+1KIUUSWDCCQPyiwCQxde16C4FeBwzudE2CFHpzQdzxi7d1nV4pER2knMhj3h0XqWnTevNozvZyJhaOI6HNPJlfHeOqX6bx6bnwZvHI6bw40fz2Z1j8dGkBuYw/BXsIjnmdfVFQKyldtRJa78W3MJVgGMunItcpdrh1zH3rHlIbz7v572VhZaaphMLyXlhpqVPnaPwI/aBjrkUDr3OiknyiRH3m30gvku/KaZpvZrk2uB+ow+SE+sT+Bhx21zJ12czAvOxCMGG8GvH+BLCHgUUwzSCchV8e74+6MesjcEZ/Hm8LpumjQnP8HOu68hdc/LLsKC93MxkbpJLS2xaNyhNnBOOeG3ehgcRcoHMCZB9g/aSm2tkXqQx8pS1TC67c8mXrB9yqD0XovlFioM+Y2l/C9biM2qbUnMhzpSlUkgm5UCiKTx4OCtJw6FLk2lDKXFCuALXQk8T8ijDpqckRw7NNqjAZYaGh6quV4rtcTlX8qJvkUludbIsHMYf/Yz523X1N+ok5z4uzQEu2O6LyXM3OjJ+8F/8C39+HTxTh5TqOOe0nn4c9RipsRZhkxuQkxp6hpVj0zpEXnQ+zkEWY6QaSNy2bgiU4LKcOy/hwzmjvXBkkMmJos+bKEGN8I0GWScSj/VTzrQHGMl6sG5slE7Mw8ZP86hdWmQceM4Rzw7GsTyhkwNkLuSp1Jr9IFzTLOqW5OUF+aNf5gs3aqnbyRulq47NBWbiEzFXFV9gg8VljOY6Y4/kteN2iTrpvmHOBIfvxZqrcEp84VVqQ530XddtjIX68KDNnId7AcfDh89Rp8e6Ex2N1zxHsY31ngGEqRY85ZDEdjzKO3NhPsRG/pbCXBwReG5ANleSCf3uoLxmPjppKJIFBzBId0ATsO6r6GoifAWRiiuPhoVDri+LPLChKBayWGxyU3C2zL5Fg9VNI/j0eBHTHNIRSiOMEn7rpgjGbcEO4IuS3FrdOCPjHBlv3JwLvzOQgn+/Zi4UXTjCQ/qm2vAETqziirF6yTWSkbjOcRgOm4HPdgh+PQ9OzCxqIeOWp5z4XOcCVA5cCt/MTeIlRHnXM9aD1zMbLNQHxLdi8vNOHwKliMbiZsaxYS56evA16SXXm8tvskZkPYcucYeMD6HCB7KfrUxDbylRphBzgYG5DOvC5pjpOv0yw4fp9Rwhp8KL8hpH30ujbm6rOuMaG+ejVxrXlTx0qE0sZeonRdpvyUatN3MIjsiF4mnOgeIKsdoE3z0ApT0vIfkKf3ZM7D",
      nickName: "Bonnie Green",
      content: "That's awesome. I think our users will really appreciate the improvements.",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'text' as const,
      status: 'delivered' as const
    },
    {
      id: "2",
      avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb8AAAEnCAYAAAA5Jk1cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe1P15uG5XVSWMj3Xuufem7276PkB6ICT0PYRAQGkEQeltEAVRS+uzrUJKxSpLSz/FEqUVlSiKiPSdBEhoEvqEJCaBEEISEtK3N915z1nfH3OOOcdce597L9b3/H7PN5P37L3Xms2YY8619n7fe5r2zsV7eusNaB3oDWgAOuya0psdx7FRl2M2KLqDDsVj9tZBDIwQrmlDfGobrqc+bd68FB3NgSKxTauZY4rGoj7HNVakaCfhS51pvjAfkXPwJ5xp7iMHZsSTiJN5JNbe+jyXNjjJiTnYUNporUIKt8QxcKjiMRPnlKMSjzrCbxOMPK+4BEca1vlOzLW26ctmTG3Ko+LQ/i11XI+EwKK5J6b0M9iTa8qI34X2I8YJZyAWMYbsBbwGAqti05m0ybwKrnWwU8YcJvUSv3NYtG/ShfTFrD+JozUJtfQ3yx11tQ6M71xM8mLsEa/UfaxbzImXep0+53N2zXWwTteP++wyN0rh0mVGX3nzE04EjyOWUT8yWIcb5hmINJfCQeouTZKidW+1KIUUSWDCCQPyiwCQxde16C4FeBwzudE2CFHpzQdzxi7d1nV4pER2knMhj3h0XqWnTevNozvZyJhaOI6HNPJlfHeOqX6bx6bnwZvHI6bw40fz2Z1j8dGkBuYw/BXsIjnmdfVFQKyldtRJa78W3MJVgGMunItcpdrh1zH3rHlIbz7v572VhZaaphMLyXlhpqVPnaPwI/aBjrkUDr3OiknyiRH3m30gvku/KaZpvZrk2uB+ow+SE+sT+Bhx21zJ12czAvOxCMGG8GvH+BLCHgUUwzSCchV8e74+6MesjcEZ/Hm8LpumjQnP8HOu68hdc/LLsKC93MxkbpJLS2xaNyhNnBOOeG3ehgcRcoHMCZB9g/aSm2tkXqQx8pS1TC67c8mXrB9yqD0XovlFioM+Y2l/C9biM2qbUnMhzpSlUkgm5UCiKTx4OCtJw6FLk2lDKXFCuALXQk8T8ijDpqckRw7NNqjAZYaGh6quV4rtcTlX8qJvkUludbIsHMYf/Yz523X1N+ok5z4uzQEu2O6LyXM3OjJ+8F/8C39+HTxTh5TqOOe0nn4c9RipsRZhkxuQkxp6hpVj0zpEXnQ+zkEWY6QaSNy2bgiU4LKcOy/hwzmjvXBkkMmJos+bKEGN8I0GWScSj/VTzrQHGMl6sG5slE7Mw8ZP86hdWmQceM4Rzw7GsTyhkwNkLuSp1Jr9IFzTLOqW5OUF+aNf5gs3aqnbyRulq47NBWbiEzFXFV9gg8VljOY6Y4/kteN2iTrpvmHOBIfvxZqrcEp84VVqQ530XddtjIX68KDNnId7AcfDh89Rp8e6Ex2N1zxHsY31ngGEqRY85ZDEdjzKO3NhPsRG/pbCXBwReG5ANleSCf3uoLxmPjppKJIFBzBId0ATsO6r6GoifAWRiiuPhoVDri+LPLChKBayWGxyU3C2zL5Fg9VNI/j0eBHTHNIRSiOMEn7rpgjGbcEO4IuS3FrdOCPjHBlv3JwLvzOQgn+/Zi4UXTjCQ/qm2vAETqziirF6yTWSkbjOcRgOm4HPdgh+PQ9OzCxqIeOWp5z4XOcCVA5cCt/MTeIlRHnXM9aD1zMbLNQHxLdi8vNOHwKliMbiZsaxYS56evA16SXXm8tvskZkPYcucYeMD6HCB7KfrUxDbylRphBzgYG5DOvC5pjpOv0yw4fp9Rwhp8KL8hpH30ujbm6rOuMaG+ejVxrXlTx0qE0sZeonRdpvyUatN3MIjsiF4mnOgeIKsdoE3z0ApT0vIfkKf3ZM7D",
      nickName: "Bonnie Green",
      content: "",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'audio' as const,
      duration: "3:42",
      status: 'delivered' as const
    },
    {
      id: "3",
      avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb8AAAEnCAYAAAA5Jk1cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe1P15uG5XVSWMj3Xuufem7276PkB6ICT0PYRAQGkEQeltEAVRS+uzrUJKxSpLSz/FEqUVlSiKiPSdBEhoEvqEJCaBEEISEtK3N915z1nfH3OOOcdce597L9b3/H7PN5P37L3Xms2YY8619n7fe5r2zsV7eusNaB3oDWgAOuya0psdx7FRl2M2KLqDDsVj9tZBDIwQrmlDfGobrqc+bd68FB3NgSKxTauZY4rGoj7HNVakaCfhS51pvjAfkXPwJ5xp7iMHZsSTiJN5JNbe+jyXNjjJiTnYUNporUIKt8QxcKjiMRPnlKMSjzrCbxOMPK+4BEca1vlOzLW26ctmTG3Ko+LQ/i11XI+EwKK5J6b0M9iTa8qI34X2I8YJZyAWMYbsBbwGAqti05m0ybwKrnWwU8YcJvUSv3NYtG/ShfTFrD+JozUJtfQ3yx11tQ6M71xM8mLsEa/UfaxbzImXep0+53N2zXWwTteP++wyN0rh0mVGX3nzE04EjyOWUT8yWIcb5hmINJfCQeouTZKidW+1KIUUSWDCCQPyiwCQxde16C4FeBwzudE2CFHpzQdzxi7d1nV4pER2knMhj3h0XqWnTevNozvZyJhaOI6HNPJlfHeOqX6bx6bnwZvHI6bw40fz2Z1j8dGkBuYw/BXsIjnmdfVFQKyldtRJa78W3MJVgGMunItcpdrh1zH3rHlIbz7v572VhZaaphMLyXlhpqVPnaPwI/aBjrkUDr3OiknyiRH3m30gvku/KaZpvZrk2uB+ow+SE+sT+Bhx21zJ12czAvOxCMGG8GvH+BLCHgUUwzSCchV8e74+6MesjcEZ/Hm8LpumjQnP8HOu68hdc/LLsKC93MxkbpJLS2xaNyhNnBOOeG3ehgcRcoHMCZB9g/aSm2tkXqQx8pS1TC67c8mXrB9yqD0XovlFioM+Y2l/C9biM2qbUnMhzpSlUkgm5UCiKTx4OCtJw6FLk2lDKXFCuALXQk8T8ijDpqckRw7NNqjAZYaGh6quV4rtcTlX8qJvkUludbIsHMYf/Yz523X1N+ok5z4uzQEu2O6LyXM3OjJ+8F/8C39+HTxTh5TqOOe0nn4c9RipsRZhkxuQkxp6hpVj0zpEXnQ+zkEWY6QaSNy2bgiU4LKcOy/hwzmjvXBkkMmJos+bKEGN8I0GWScSj/VTzrQHGMl6sG5slE7Mw8ZP86hdWmQceM4Rzw7GsTyhkwNkLuSp1Jr9IFzTLOqW5OUF+aNf5gs3aqnbyRulq47NBWbiEzFXFV9gg8VljOY6Y4/kteN2iTrpvmHOBIfvxZqrcEp84VVqQ530XddtjIX68KDNnId7AcfDh89Rp8e6Ex2N1zxHsY31ngGEqRY85ZDEdjzKO3NhPsRG/pbCXBwReG5ANleSCf3uoLxmPjppKJIFBzBId0ATsO6r6GoifAWRiiuPhoVDri+LPLChKBayWGxyU3C2zL5Fg9VNI/j0eBHTHNIRSiOMEn7rpgjGbcEO4IuS3FrdOCPjHBlv3JwLvzOQgn+/Zi4UXTjCQ/qm2vAETqziirF6yTWSkbjOcRgOm4HPdgh+PQ9OzCxqIeOWp5z4XOcCVA5cCt/MTeIlRHnXM9aD1zMbLNQHxLdi8vNOHwKliMbiZsaxYS56evA16SXXm8tvskZkPYcucYeMD6HCB7KfrUxDbylRphBzgYG5DOvC5pjpOv0yw4fp9Rwhp8KL8hpH30ujbm6rOuMaG+ejVxrXlTx0qE0sZeonRdpvyUatN3MIjsiF4mnOgeIKsdoE3z0ApT0vIfkKf3ZM7D",
      nickName: "Bonnie Green",
      content: "",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'document' as const,
      fileName: "Flowbite Terms & Conditions",
      fileSize: 18,
      status: 'delivered' as const
    },
    {
      id: "4",
      avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAb8AAAEnCAYAAAA5Jk1cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe1P15uG5XVSWMj3Xuufem7276PkB6ICT0PYRAQGkEQeltEAVRS+uzrUJKxSpLSz/FEqUVlSiKiPSdBEhoEvqEJCaBEEISEtK3N915z1nfH3OOOcdce597L9b3/H7PN5P37L3Xms2YY8619n7fe5r2zsV7eusNaB3oDWgAOuya0psdx7FRl2M2KLqDDsVj9tZBDIwQrmlDfGobrqc+bd68FB3NgSKxTauZY4rGoj7HNVakaCfhS51pvjAfkXPwJ5xp7iMHZsSTiJN5JNbe+jyXNjjJiTnYUNporUIKt8QxcKjiMRPnlKMSjzrCbxOMPK+4BEca1vlOzLW26ctmTG3Ko+LQ/i11XI+EwKK5J6b0M9iTa8qI34X2I8YJZyAWMYbsBbwGAqti05m0ybwKrnWwU8YcJvUSv3NYtG/ShfTFrD+JozUJtfQ3yx11tQ6M71xM8mLsEa/UfaxbzImXep0+53N2zXWwTteP++wyN0rh0mVGX3nzE04EjyOWUT8yWIcb5hmINJfCQeouTZKidW+1KIUUSWDCCQPyiwCQxde16C4FeBwzudE2CFHpzQdzxi7d1nV4pER2knMhj3h0XqWnTevNozvZyJhaOI6HNPJlfHeOqX6bx6bnwZvHI6bw40fz2Z1j8dGkBuYw/BXsIjnmdfVFQKyldtRJa78W3MJVgGMunItcpdrh1zH3rHlIbz7v572VhZaaphMLyXlhpqVPnaPwI/aBjrkUDr3OiknyiRH3m30gvku/KaZpvZrk2uB+ow+SE+sT+Bhx21zJ12czAvOxCMGG8GvH+BLCHgUUwzSCchV8e74+6MesjcEZ/Hm8LpumjQnP8HOu68hdc/LLsKC93MxkbpJLS2xaNyhNnBOOeG3ehgcRcoHMCZB9g/aSm2tkXqQx8pS1TC67c8mXrB9yqD0XovlFioM+Y2l/C9biM2qbUnMhzpSlUkgm5UCiKTx4OCtJw6FLk2lDKXFCuALXQk8T8ijDpqckRw7NNqjAZYaGh6quV4rtcTlX8qJvkUludbIsHMYf/Yz523X1N+ok5z4uzQEu2O6LyXM3OjJ+8F/8C39+HTxTh5TqOOe0nn4c9RipsRZhkxuQkxp6hpVj0zpEXnQ+zkEWY6QaSNy2bgiU4LKcOy/hwzmjvXBkkMmJos+bKEGN8I0GWScSj/VTzrQHGMl6sG5slE7Mw8ZP86hdWmQceM4Rzw7GsTyhkwNkLuSp1Jr9IFzTLOqW5OUF+aNf5gs3aqnbyRulq47NBWbiEzFXFV9gg8VljOY6Y4/kteN2iTrpvmHOBIfvxZqrcEp84VVqQ530XddtjIX68KDNnId7AcfDh89Rp8e6Ex2N1zxHsY31ngGEqRY85ZDEdjzKO3NhPsRG/pbCXBwReG5ANleSCf3uoLxmPjppKJIFBzBId0ATsO6r6GoifAWRiiuPhoVDri+LPLChKBayWGxyU3C2zL5Fg9VNI/j0eBHTHNIRSiOMEn7rpgjGbcEO4IuS3FrdOCPjHBlv3JwLvzOQgn+/Zi4UXTjCQ/qm2vAETqziirF6yTWSkbjOcRgOm4HPdgh+PQ9OzCxqIeOWp5z4XOcCVA5cCt/MTeIlRHnXM9aD1zMbLNQHxLdi8vNOHwKliMbiZsaxYS56evA16SXXm8tvskZkPYcucYeMD6HCB7KfrUxDbylRphBzgYG5DOvC5pjpOv0yw4fp9Rwhp8KL8hpH30ujbm6rOuMaG+ejVxrXlTx0qE0sZeonRdpvyUatN3MIjsiF4mnOgeIKsdoE3z0ApT0vIfkKf3ZM7D",
      nickName: "Bonnie Green",
      content: "This is the new office <3",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'image' as const,
      mediaUrl: "/docs/images/blog/image-2.jpg",
      status: 'delivered' as const
    },
    {
      id: "5",
      avatarUrl: undefined,
      nickName: "Bonnie Green",
      content: "This is the new office <3",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'gallery' as const,
      images: [
        "/docs/images/blog/image-1.jpg",
        "/docs/images/blog/image-2.jpg",
        "/docs/images/blog/image-3.jpg",
        "/docs/images/blog/image-1.jpg"
      ],
      status: 'delivered' as const
    },
    {
      id: "6",
      avatarUrl: undefined,
      nickName: "Bonnie Green",
      content: "Check out this open-source UI component library based on Tailwind CSS:",
      type: 'other' as const,
      timestamp: "11:46",
      messageType: 'url' as const,
      urlPreview: {
        title: "GitHub - themesberg/flowbite: The most popular and open source libra ...",
        description: "github.com",
        image: "https://flowbite.com/docs/images/og-image.png",
        url: "https://github.com/themesberg/flowbite"
      },
      status: 'delivered' as const
    }
  ]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-8">Clean Chat Message Types</h1>

      {messages.map((message) => (
        <div key={message.id} className="clean-message-container">
          <CleanMessage
            message={message}
            onEmojiClick={(id: string) => console.log('Emoji clicked:', id)}
          />
        </div>
      ))}
    </div>
  );
}
