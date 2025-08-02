'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EssayProblemUploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    price: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      setError('PDF 파일만 업로드 가능합니다.');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 입력 검증
    if (!formData.title || !formData.description || !formData.dueDate || !formData.price) {
      setError('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    const price = parseInt(formData.price);
    if (isNaN(price) || price < 0) {
      setError('유효한 가격을 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('dueDate', formData.dueDate);
      submitData.append('price', formData.price);
      
      if (pdfFile) {
        submitData.append('pdfFile', pdfFile);
      }

      const response = await fetch('/api/essay-problems', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '문제 업로드 중 오류가 발생했습니다.');
      } else {
        setSuccess('논술 문제가 성공적으로 업로드되었습니다!');
        // 폼 초기화
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          price: '',
        });
        setPdfFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        논술 문제 업로드
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            문제 제목 *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="논술 문제 제목을 입력하세요"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            문제 설명 *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="논술 문제의 상세한 설명을 입력하세요"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
            마감일 *
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            가격 (원) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
            value={formData.price}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
            PDF 파일 (선택사항)
          </label>
          <input
            type="file"
            id="pdfFile"
            name="pdfFile"
            accept=".pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-500 mt-1">
            PDF 파일을 업로드하면 학생들이 다운로드할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </form>
    </div>
  );
} 